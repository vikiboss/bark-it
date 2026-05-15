import {
  base64ToBytes,
  bytesToBase64Url,
  jsonToBase64Url,
  semaphore,
  stripPEM,
  toArray,
} from './helpers.ts'

import type {
  APNsOptions,
  APNsSound,
  BarkDeleteOptions,
  BarkOptions,
  BarkPushOptions,
  BarkUpdateOptions,
  PushResult,
} from './types.ts'

const APNS_HOST = 'api.push.apple.com'
const APNS_HOST_DEV = 'api.sandbox.push.apple.com'
const APNS_API_VERSION = '3'

const TOPIC = 'me.fin.bark'
const KEY_ID = 'LH4T9V5U4R'
const TEAM_ID = '5U8LBRXG3A'
const TOKEN_TTL = 55 * 60 * 1000

const DEFAULT_ICON_URL = 'https://image.viki.moe/share/921d6a.png'

const DEFAULT_AUTH_KEY = `
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg4vtC3g5L5HgKGJ2+
T1eA0tOivREvEAY2g+juRXJkYL2gCgYIKoZIzj0DAQehRANCAASmOs3JkSyoGEWZ
sUGxFs/4pw1rIlSV2IC19M8u3G5kq36upOwyFWj9Gi3Ejc9d3sC7+SHRqXrEAJow
8/7tRpV+
-----END PRIVATE KEY-----
`.trim()

const DEFAULT_SOUND: APNsSound = {
  name: 'healthnotification',
  critical: 0,
  volume: 0.5,
}

export class Bark {
  #authKey = DEFAULT_AUTH_KEY
  #deviceTokens: string[]
  #concurrency: number = 5
  #token = ''
  #tokenExpiredAt = 0
  #host = APNS_HOST
  #ver = APNS_API_VERSION
  #icon = DEFAULT_ICON_URL

  constructor(options: BarkOptions = {}) {
    this.#icon = options.icon ?? this.#icon
    this.#host = options.env === 'development' ? APNS_HOST_DEV : APNS_HOST
    this.#authKey = stripPEM(options.authKey ?? this.#authKey)
    this.#deviceTokens = options.deviceToken ? toArray(options.deviceToken) : []
    this.#concurrency = options.concurrency ?? this.#concurrency
  }

  async push(
    barkOptions: BarkPushOptions = {},
    apnsOptions: APNsOptions = {},
    authKey: string = '',
  ): Promise<PushResult[]> {
    const tokens = barkOptions.deviceToken ? toArray(barkOptions.deviceToken) : this.#deviceTokens

    if (tokens.length === 0) throw new Error('[Bark] deviceToken is required')

    return this.#sendBatch(tokens, barkOptions, apnsOptions, authKey)
  }

  async update(
    barkUpdateOptions: BarkUpdateOptions,
    apnsOptions: APNsOptions = {},
    authKey: string = '',
  ): Promise<PushResult[]> {
    const tokens = barkUpdateOptions.deviceToken
      ? toArray(barkUpdateOptions.deviceToken)
      : this.#deviceTokens

    if (tokens.length === 0) throw new Error('[Bark] deviceToken is required')

    const barkOptions: BarkPushOptions = {
      ...barkUpdateOptions,
    }

    return this.#sendBatch(tokens, barkOptions, apnsOptions, authKey)
  }

  async delete(deleteOptions: BarkDeleteOptions, authKey: string = ''): Promise<PushResult[]> {
    const tokens = deleteOptions.deviceToken
      ? toArray(deleteOptions.deviceToken)
      : this.#deviceTokens

    if (tokens.length === 0) throw new Error('[Bark] deviceToken is required')

    return this.#sendBatch(tokens, { id: deleteOptions.id, delete: true }, {}, authKey)
  }

  async getAuthToken(): Promise<string> {
    if (this.#token && this.#tokenExpiredAt > Date.now()) return this.#token

    const keyBytes = base64ToBytes(this.#authKey)
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign'],
    )

    const header = jsonToBase64Url({ alg: 'ES256', kid: KEY_ID })

    const claims = jsonToBase64Url({
      iss: TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
    })

    const data = new TextEncoder().encode(`${header}.${claims}`)
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data)

    this.#token = `${header}.${claims}.${bytesToBase64Url(new Uint8Array(signature))}`
    this.#tokenExpiredAt = Date.now() + TOKEN_TTL

    return this.#token
  }

  async #sendBatch(
    tokens: string[],
    barkOptions: BarkPushOptions & { delete?: boolean },
    apnsOptions: APNsOptions,
    authKey: string,
  ): Promise<PushResult[]> {
    const s = semaphore(this.#concurrency)

    const settled = await Promise.all(
      tokens.map(async token => {
        await s.acquire()
        try {
          return await this.#sendOne(token, barkOptions, apnsOptions, authKey)
        } catch (err) {
          return {
            success: false,
            status: -1,
            message: err instanceof Error ? err.message : String(err),
            deviceToken: token,
          }
        } finally {
          s.release()
        }
      }),
    )

    return settled
  }

  async #sendOne(
    deviceToken: string,
    barkOptions: BarkPushOptions & { delete?: boolean },
    apnsOptions: APNsOptions,
    authKey: string,
  ): Promise<PushResult> {
    const url = `https://${this.#host}/${this.#ver}/device/${encodeURIComponent(deviceToken)}`
    const token = authKey || (await this.getAuthToken())

    const aps = this.#buildAps(barkOptions, apnsOptions)
    const payload = this.#buildPayload(barkOptions, aps)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apns-topic': TOPIC,
        'apns-push-type': 'alert',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return {
      success: res.ok,
      status: res.status,
      message: res.statusText || 'ok',
      deviceToken,
    }
  }

  #buildAlert(barkOptions: BarkPushOptions, apnsOptions: APNsOptions): APNsOptions['alert'] {
    const alert: Record<string, unknown> = {}

    if (apnsOptions.alert) {
      if (typeof apnsOptions.alert === 'string') {
        alert.body = apnsOptions.alert
      } else {
        Object.assign(alert, apnsOptions.alert)
      }
    }

    if (barkOptions.title) alert.title = barkOptions.title
    if (barkOptions.subtitle) alert.subtitle = barkOptions.subtitle
    if (barkOptions.markdown) alert.body = barkOptions.markdown
    else if (barkOptions.body) alert.body = barkOptions.body

    return alert as APNsOptions['alert']
  }

  #buildSound(barkOptions: BarkPushOptions, apnsOptions: APNsOptions): APNsSound {
    const sound: APNsSound = { ...DEFAULT_SOUND }

    if (apnsOptions.sound) {
      if (typeof apnsOptions.sound === 'string') {
        sound.name = apnsOptions.sound
      } else {
        Object.assign(sound, apnsOptions.sound)
      }
    }

    if (barkOptions.sound) {
      sound.name = barkOptions.sound
    }

    if (barkOptions.volume !== undefined) {
      sound.volume = Math.min(Math.max(barkOptions.volume / 10, 0), 1)
    }

    const isCritical =
      barkOptions.level === 'critical' || apnsOptions['interruption-level'] === 'critical'
    if (isCritical) sound.critical = 1
    else if (sound.critical === undefined) sound.critical = 0

    return sound
  }

  #buildAps(barkOptions: BarkPushOptions, apnsOptions: APNsOptions): APNsOptions {
    const aps: Record<string, unknown> = {
      badge: 0,
      category: '',
      'thread-id': 'Default',
      'mutable-content': 1,
    }

    for (const [k, v] of Object.entries(apnsOptions)) {
      if (k === 'alert' || k === 'sound') continue
      if (v !== undefined) aps[k] = v
    }

    if (barkOptions.badge !== undefined) aps.badge = barkOptions.badge
    if (barkOptions.level) aps['interruption-level'] = barkOptions.level

    aps.alert = this.#buildAlert(barkOptions, apnsOptions)
    aps.sound = this.#buildSound(barkOptions, apnsOptions)

    return aps as APNsOptions
  }

  #buildPayload(
    barkOptions: BarkPushOptions & { delete?: boolean },
    aps: APNsOptions,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {}

    if (barkOptions.icon) payload.icon = barkOptions.icon
    else payload.icon = this.#icon

    const hasCopyContent = barkOptions.enableCopy !== false && !!barkOptions.copyContent

    if (barkOptions.id) payload.id = barkOptions.id
    if (barkOptions.image) payload.image = barkOptions.image
    if (barkOptions.url) payload.url = barkOptions.url
    if (barkOptions.group) payload.group = barkOptions.group
    if (barkOptions.cipherText) payload.ciphertext = barkOptions.cipherText
    if (barkOptions.enableCopy || hasCopyContent) payload.autoCopy = '1'
    if (barkOptions.copyContent) payload.copy = barkOptions.copyContent
    if (barkOptions.archive !== undefined) payload.isArchive = '1'
    if (barkOptions.ttl !== undefined) payload.ttl = barkOptions.ttl
    if (barkOptions.call !== undefined) payload.call = '1'
    if (barkOptions.action) payload.action = barkOptions.action
    if (barkOptions.delete !== undefined) payload.delete = '1'

    payload.aps = aps

    return payload
  }
}
