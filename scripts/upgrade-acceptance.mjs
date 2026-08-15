import process from 'node:process'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1])

const cdpBase = args.get('--cdp') ?? 'http://127.0.0.1:9233'
const pageUrl = args.get('--url')
const phase = args.get('--phase')
const closeBrowser = args.get('--close') === 'true'
if (!pageUrl || !['seed', 'verify', 'stock'].includes(phase)) {
  throw new Error('Usage: node scripts/upgrade-acceptance.mjs --url <URL> --phase <seed|verify|stock> [--cdp <URL>]')
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
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
  if (!message.id) return
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
const evaluate = async expression => {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
const reload = async (expectPlugin = true) => {
  await call('Page.reload', { ignoreCache: true })
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await delay(100)
    const ready = await evaluate(`document.readyState === 'complete'
      && ${expectPlugin ? 'document.documentElement.dataset.dshOs26 !== undefined' : 'true'}`)
    if (ready) return
  }
  throw new Error('DSH page did not become ready after reload')
}
const assert = (value, message) => { if (!value) throw new Error(message) }

try {
  await call('Runtime.enable')
  await call('Page.enable')

  if (phase === 'seed') {
    await evaluate(`localStorage.setItem('dsh-os26.config.v1', JSON.stringify({
      version: 0, enabled: true, quality: 'balanced', opacity: 20, blur: 999
    }))`)
    await reload()
    const report = await evaluate(`(() => ({
      stored: JSON.parse(localStorage.getItem('dsh-os26.config.v1')),
      root: document.documentElement.dataset.dshOs26,
      opacity: Number(getComputedStyle(document.documentElement).getPropertyValue('--os26-opacity')),
      blur: getComputedStyle(document.documentElement).getPropertyValue('--os26-blur').trim(),
    }))()`)
    assert(report.root === 'on', 'legacy plugin failed to start with legacy configuration')
    assert(report.stored.opacity === 20 && report.stored.blur === 999, 'legacy fixture was not stored')
    assert(report.opacity < 0.65, 'legacy build unexpectedly applied the new readable opacity floor')
    console.log(JSON.stringify({ phase, ...report }, null, 2))
  } else if (phase === 'verify') {
    await reload()
    const report = await evaluate(`(() => ({
      stored: JSON.parse(localStorage.getItem('dsh-os26.config.v1')),
      root: document.documentElement.dataset.dshOs26,
      quality: document.documentElement.dataset.os26Quality,
      opacity: Number(getComputedStyle(document.documentElement).getPropertyValue('--os26-opacity')),
      blur: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--os26-blur')),
      styles: document.querySelectorAll('style[data-dsh-os26]').length,
      capsules: document.querySelectorAll('.os26-status-capsule').length,
    }))()`)
    assert(report.root === 'on', 'upgraded plugin failed to start')
    assert(report.stored?.version === 0 && report.stored?.opacity === 20 && report.stored?.blur === 999,
      'legacy fixture did not survive the real browser/profile upgrade')
    assert(report.quality === 'balanced', 'upgrade did not preserve the valid quality preference')
    assert(report.opacity >= 0.65, `upgraded opacity escaped the readable floor: ${report.opacity}`)
    assert(report.blur <= 48, `upgraded blur escaped the supported ceiling: ${report.blur}`)
    assert(report.styles === 1 && report.capsules === 1, 'upgrade mounted duplicate UI')
    console.log(JSON.stringify({ phase, ...report }, null, 2))
  } else {
    await reload(false)
    const report = await evaluate(`({
      root: document.documentElement.dataset.dshOs26 ?? null,
      quality: document.documentElement.dataset.os26Quality ?? null,
      styles: document.querySelectorAll('style[data-dsh-os26]').length,
      capsules: document.querySelectorAll('.os26-status-capsule').length,
      token: getComputedStyle(document.documentElement).getPropertyValue('--dsw-alias-bg-layer-1').trim(),
    })`)
    assert(report.root === null && report.quality === null, 'uninstall left DSH-OS26 root state behind')
    assert(report.styles === 0 && report.capsules === 0, 'uninstall left DSH-OS26 DOM behind')
    assert(report.token === '', 'uninstall left a theme token override behind')
    console.log(JSON.stringify({ phase, ...report }, null, 2))
  }
  if (closeBrowser) await call('Browser.close')
} finally {
  socket.close()
}
