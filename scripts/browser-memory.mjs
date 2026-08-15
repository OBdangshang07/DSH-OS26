import process from 'node:process'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1])
const cdpBase = args.get('--cdp') ?? 'http://127.0.0.1:9229'
const pageUrl = args.get('--url')
const label = args.get('--label') ?? 'measurement'
if (!pageUrl) throw new Error('Usage: node scripts/browser-memory.mjs --url <URL> [--cdp <URL>] [--label <label>]')

const targets = await fetch(`${cdpBase}/json/list`).then(response => response.json())
const target = targets.find(item => item.type === 'page' && item.url.startsWith(pageUrl))
if (!target?.webSocketDebuggerUrl) throw new Error(`No CDP page found for ${pageUrl}`)
const socket = new WebSocket(target.webSocketDebuggerUrl)
let nextId = 0
const pending = new Map()
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  const request = pending.get(message.id)
  if (!request) return
  pending.delete(message.id)
  if (message.error) request.reject(new Error(message.error.message))
  else request.resolve(message.result)
})
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params }))
})

await call('Runtime.enable')
await call('HeapProfiler.enable')
for (let iteration = 0; iteration < 3; iteration += 1) {
  await call('HeapProfiler.collectGarbage')
  await new Promise(resolve => setTimeout(resolve, 250))
}
const heap = await call('Runtime.getHeapUsage')
const dom = await call('Runtime.evaluate', {
  expression: `({ nodes: document.getElementsByTagName('*').length,
    os26Nodes: document.querySelectorAll('[class*="os26"],style[data-dsh-os26]').length,
    os26Enabled: document.documentElement.dataset.dshOs26 ?? null })`,
  returnByValue: true,
})
console.log(JSON.stringify({ label, browser: await fetch(`${cdpBase}/json/version`).then(r => r.json()).then(v => v.Browser),
  heap, dom: dom.result.value }, null, 2))
socket.close()
