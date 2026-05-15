/// <reference path="../node_modules/@types/node/index.d.ts" />

import { Bark } from '../src/index.ts'

const bark = new Bark({
  deviceToken: process.env.BARK_DEVICE_TOKEN!,
})

async function test() {
  // push
  await bark.push({ id: 'abc', title: '测试消息' }).then(console.log)

  // await new Promise(r => setTimeout(r, 3000))

  // // update
  // await bark.update({ id: 'abc', title: 'updated title' }).then(console.log)

  // await new Promise(r => setTimeout(r, 3000))

  // // delete
  // await bark.delete({ id: 'abc' }).then(console.log)
}

test()
