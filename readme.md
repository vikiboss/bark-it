# bark-it

[Bark](https://github.com/Finb/bark) SDK for TypeScript，无需服务端，直连 Apple 推送服务。

> Bark 是一款免费、轻量的 iOS 推送工具，基于 APNs 实现，不额外耗电，隐私安全。

## 安装

```sh
pnpm install bark-it
```

## 快速开始

```ts
import { Bark } from 'bark-it'

const bark = new Bark({
  deviceToken: 'your-device-token-from-bark-app',
})

// 推送通知
await bark.push({ title: 'Hello', body: '来自 bark-it 的问候' })

// 更新通知（推送/更新都需要传入相同 id）
await bark.update({ id: 'xxx', title: '更新后的标题' })

// 删除通知（推送/删除都需要传入相同 id）
await bark.delete({ id: 'xxx' })
```

## 配置

```ts
const bark = new Bark({
  // 默认设备 token，后续 push/update/delete 也可按次传入
  deviceToken: 'single-token', // 或 ['token-1', 'token-2']
  // 自定义推送图标
  icon: 'https://example.com/icon.png',
})
```

## 多设备推送

如果构造时未传入 `deviceToken`，每次调用时按需传入即可；传入数组可批量推送：

```ts
const bark = new Bark()

await bark.push({
  title: '全员通知',
  deviceToken: ['token-a', 'token-b', 'token-c'],
})
```

## 覆盖 APNs 原始配置

`apnsOptions` 提供了更细粒度的 APNs 控制。字段合并优先级为 **barkOptions → apnsOptions → 默认值**：

```ts
await bark.push(
  {
    title: '新消息',
    body: '你有 3 条未读消息',
    badge: 3,
  },
  {
    // 在 barkOptions 未设置 sound 时生效
    sound: 'chime',
    // 在 barkOptions 未设置 level 时生效
    'interruption-level': 'timeSensitive',
  },
)
```

常见场景：`barkOptions` 负责 Bark 业务字段，`apnsOptions` 用来补充少数 Bark 没有封装的原始 APNs 属性（如 `filter-criteria`、`relevance-score` 等）。

## Markdown 推送

```ts
await bark.push({
  title: '日报',
  markdown: '## 今日摘要\n\n- 完成 **3** 项任务\n- 剩余 **1** 项待办',
})
```

## 加密推送

```ts
await bark.push({
  title: '加密消息',
  cipherText: '<encrypted-base64-string>',
})
```

## 自定义铃声与中断等级

```ts
await bark.push({
  title: '紧急通知',
  body: '服务器 CPU 超过 90%',
  sound: 'alarm',
  level: 'critical',
  volume: 8, // 0-10，仅在 critical 下生效
})
```

## 图标与图片

```ts
await bark.push({
  title: 'GitHub Star',
  icon: 'https://example.com/repo-icon.png',
  image: 'https://example.com/screenshot.png',
  url: 'https://github.com/vikiboss/bark-it',
})
```

## API

### `new Bark(options?)`

| 参数          | 类型                            | 默认值         | 说明           |
| ------------- | ------------------------------- | -------------- | -------------- |
| `deviceToken` | `string \| string[]`            | `[]`           | 默认设备 token |
| `authKey`     | `string`                        | 内置共享 Key   | APNs P8 证书   |
| `icon`        | `string`                        | Bark 图标      | 默认通知图标   |
| `concurrency` | `number`                        | `5`            | 最大并发请求数 |
| `env`         | `'production' \| 'development'` | `'production'` | APNs 环境      |

### `bark.push(barkOptions, apnsOptions?, authKey?)`

发送通知，返回 `Promise<PushResult[]>`。

### `bark.update(barkUpdateOptions, apnsOptions?, authKey?)`

更新已有通知，需传入 `id`。参数同 `push`，但 `id` 必填。

### `bark.delete(deleteOptions, authKey?)`

删除已有通知，需传入 `id`。Bark v1.5.2 以上支持。

```ts
await bark.delete({ id: 'notification-id' })
// 按设备指定
await bark.delete({ id: 'notification-id', deviceToken: 'specific-token' })
```

### `PushResult`

| 字段          | 类型      | 说明                           |
| ------------- | --------- | ------------------------------ |
| `success`     | `boolean` | 请求是否成功                   |
| `status`      | `number`  | HTTP 状态码，`-1` 表示请求异常 |
| `message`     | `string`  | 状态文本或错误信息             |
| `deviceToken` | `string`  | 对应的设备 token               |

## FAQ

### deviceToken 泄漏怎么办？

卸载 Bark APP 重新安装即可刷新 deviceToken

## 许可

MIT © [Viki](https://github.com/vikiboss)
