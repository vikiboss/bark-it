import { Bark } from './src/index.ts'

const client = new Bark({
  deviceToken: process.env.BARK_DEVICE_TOKEN!,
})

async function test() {
  // push
  await client.push({ id: 'abc', title: '123' }).then(console.log)
  await new Promise(r => setTimeout(r, 3000))

  // update
  await client.update({ id: 'abc', title: 'updated title' }).then(console.log)
  await new Promise(r => setTimeout(r, 3000))

  // delete
  await client.delete({ id: 'abc' }).then(console.log)
}

test()
