import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const inputUrl = new URL('./input.json', import.meta.url)
const input = JSON.parse(await readFile(inputUrl, 'utf8'))
const checks = [
  () => assert.equal(input.schema, 'dsh-os26-demo/v1'),
  () => assert.equal(input.taskId, 'os26-safe-video-fixture'),
  () => assert.match(input.title, /DSH-OS26/),
  () => assert.equal(input.safe, true),
  () => assert.equal(input.network, false),
  () => assert.equal(input.output, 'work/result.json'),
  () => assert.ok(Array.isArray(input.items)),
  () => assert.equal(input.items.length, 4),
  () => assert.ok(input.items.every(item => typeof item.id === 'string' && item.id.length > 0)),
  () => assert.equal(new Set(input.items.map(item => item.id)).size, input.items.length),
  () => assert.ok(input.items.every(item => typeof item.label === 'string' && item.label.length > 0)),
  () => assert.equal(input.items.reduce((total, item) => total + item.weight, 0), 26),
]

for (const check of checks) check()
await new Promise(resolve => setTimeout(resolve, 900))

console.log(JSON.stringify({
  fixture: input.taskId,
  status: 'PASS',
  checks: `${checks.length}/${checks.length}`,
  summary: 'DSH_OS26_DEMO: 12/12 PASS',
}, null, 2))
