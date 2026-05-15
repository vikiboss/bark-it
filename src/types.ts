export interface BarkOptions {
  /**
   * 默认设备 token，构造时非必填，也可在 Push 时补充
   *
   * @default []
   */
  deviceToken?: string | string[]
  /**
   * APNs P8 证书 Key，PEM 格式字符串
   *
   * @default DEFAULT_AUTH_KEY
   */
  authKey?: string
  /**
   * 默认 icon 链接
   *
   * @default 'https://image.viki.moe/share/921d6a.png'
   */
  icon?: string
  /**
   * 最大并发通知请求数，默认 5
   *
   * @default 5
   */
  concurrency?: number
  /**
   * 推送环境，默认生产
   *
   * @default 'production'
   */
  env?: 'development' | 'production'
}

export interface BarkPushOptions {
  /**
   * 使用相同的 ID 值时，将更新对应推送的通知内容，需 Bark v1.5.2 以上
   *
   * @default undefined
   */
  id?: string
  /**
   * 推送标题
   *
   * @default undefined
   */
  title?: string
  /**
   * 推送副标题
   *
   * @default undefined
   */
  subtitle?: string
  /**
   * 推送内容
   *
   * @default undefined
   */
  body?: string
  /**
   * 推送内容，支持基础 Markdown 格式。传递了此参数将忽略 body 字段
   *
   * @default undefined
   */
  markdown?: string
  /**
   * 角标数字，可以是任意正数
   *
   * @default 0
   */
  badge?: number
  /**
   * 通知铃声
   *
   * @default 'healthnotification'
   */
  sound?: APNsSound['name']
  /**
   * 通知中断等级
   *
   * @default 'active'
   */
  level?: APNsOptions['interruption-level']
  /**
   * 重要通知（level 为 critical）时的通知音量，范围 0-10
   *
   * @default 5
   */
  volume?: number
  /**
   * 复制推送时，指定复制的内容，不传此参数将复制整个推送内容
   *
   * @default undefined
   */
  copyContent?: string
  /**
   * 启用时，iOS 14.5 以下自动复制推送内容，iOS 14.5 以上需手动长按推送或下拉推送
   *
   * 存在 `copyContent` 时默认为 true，否则默认 false
   *
   * @default true
   */
  enableCopy?: boolean
  /**
   * 点击推送时跳转的 URL，支持 URL Scheme 和 Universal Link
   *
   * @default undefined
   */
  url?: string
  /**
   * 推送自定义图标，设置的图标将替换默认 Bark 图标
   *
   * @default undefined
   */
  icon?: string
  /**
   * 推送图片 url
   *
   * @default undefined
   */
  image?: string
  /**
   * 对消息进行分组，推送将按 group 分组显示在通知中心中
   *
   * @default undefined
   */
  group?: string
  /**
   * 加密推送的密文
   *
   * @default undefined
   */
  cipherText?: string
  /**
   * 启用时保存推送，不传按 APP 内设置来决定是否保存
   *
   * @default undefined
   */
  archive?: boolean
  /**
   * 保存推送的有效期，单位为秒。仅对保存到历史记录的消息生效，到期自动删除
   *
   * @default undefined
   */
  ttl?: number
  /**
   * 启用时，通知铃声重复播放
   *
   * @default undefined
   */
  call?: boolean
  /**
   * 设置时，点击推送跳转到 APP 时会弹出操作弹窗
   *
   * @default undefined
   */
  action?: 'alert'
  /**
   * 设备 token，若构造时已填，则此处可选
   *
   * @default undefined
   */
  deviceToken?: string | string[]
}

export interface BarkDeleteOptions extends Pick<BarkPushOptions, 'deviceToken'> {
  /**
   * 删除的通知 ID，需 Bark v1.5.2 以上
   */
  id: string
}

export interface BarkUpdateOptions extends Omit<BarkPushOptions, 'id'> {
  /**
   * 更新的通知 ID，需 Bark v1.5.2 以上
   */
  id: string
}

export interface APNsAlert {
  title?: string
  subtitle?: string
  body?: string
  'launch-image'?: string
  'title-loc-key'?: string
  'title-loc-args'?: string[]
  'subtitle-loc-key'?: string
  'subtitle-loc-args'?: string[]
  'loc-key'?: string
  'loc-args'?: string[]
}

export interface APNsSound {
  critical?: number
  volume?: number
  name?:
    | 'alarm'
    | 'anticipate'
    | 'bell'
    | 'birdsong'
    | 'bloom'
    | 'calypso'
    | 'chime'
    | 'choo'
    | 'descent'
    | 'electronic'
    | 'fanfare'
    | 'glass'
    | 'gotosleep'
    | 'healthnotification'
    | 'horn'
    | 'ladder'
    | 'mailsent'
    | 'minuet'
    | 'multiwayinvitation'
    | 'newmail'
    | 'newsflash'
    | 'noir'
    | 'paymentsuccess'
    | 'shake'
    | 'sherwoodforest'
    | 'silence'
    | 'spell'
    | 'suspense'
    | 'telegraph'
    | 'tiptoes'
    | 'typewriters'
    | 'update'
    | (string & {})
}

export interface APNsOptions {
  alert?: string | APNsAlert
  badge?: number
  sound?: APNsSound['name'] | APNsSound
  category?: string
  timestamp?: number
  event?: string
  attributes?: object
  'thread-id'?: string
  'content-available'?: number
  'mutable-content'?: number
  'target-content-id'?: string
  'interruption-level'?: 'active' | 'timeSensitive' | 'passive' | 'critical'
  'relevance-score'?: number
  'filter-criteria'?: string
  'stale-date'?: number
  'content-state'?: object
  'dismissal-date'?: number
  'attributes-type'?: string
}

export interface PushResult {
  /** 请求是否成功 */
  success: boolean
  /** HTTP 状态码，-1 代表请求过程中发生了错误 */
  status: number
  /** 响应消息，成功时为状态文本，失败时为错误信息 */
  message: string
  /** 对应的 token */
  deviceToken: string
  /** 响应数据，成功时包含服务器返回的数据，失败时通常不包含此字段 */
  data: any | null
}
