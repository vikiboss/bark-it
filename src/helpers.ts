// ---- helpers ----

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes as Uint8Array<ArrayBuffer>
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function jsonToBase64Url(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function stripPEM(pem: string): string {
  return pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export function semaphore(max: number) {
  let count = 0
  const tasks: (() => void)[] = []

  const next = () => {
    if (tasks.length && count < max) {
      count++
      tasks.shift()!()
    }
  }

  return {
    acquire: (): Promise<void> => {
      if (count < max) {
        count++
        return Promise.resolve()
      }
      return new Promise(resolve => {
        tasks.push(() => {
          count++
          resolve()
        })
      })
    },
    release: () => {
      count--
      next()
    },
  }
}
