import process from 'node:process'
import { writeFile } from 'node:fs/promises'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1])
}
const cdpBase = args.get('--cdp') ?? 'http://127.0.0.1:9229'
const pageUrl = args.get('--url')
const screenshotPath = args.get('--screenshot')
if (!pageUrl) throw new Error('Usage: node scripts/browser-acceptance.mjs --url <DSH URL> [--cdp <CDP URL>]')

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const targets = await fetch(`${cdpBase}/json/list`).then(response => response.json())
const target = targets.find(item => item.type === 'page' && item.url.startsWith(pageUrl))
if (!target?.webSocketDebuggerUrl) throw new Error(`No CDP page found for ${pageUrl}`)

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 0
    this.pending = new Map()
    this.exceptions = []
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params.exceptionDetails
        this.exceptions.push({
          text: details.text,
          description: details.exception?.description ?? '',
          url: details.url ?? '',
          line: details.lineNumber ?? 0,
        })
        return
      }
      if (!message.id) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(`${message.error.message}: ${message.error.data ?? ''}`))
      else pending.resolve(message.result)
    })
  }

  call(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
    return result.result.value
  }

  close() { this.socket.close() }
}

function assert(value, message) {
  if (!value) throw new Error(message)
}

const cdp = new Cdp(target.webSocketDebuggerUrl)
await cdp.open()
await cdp.call('Runtime.enable')
await cdp.call('Page.enable')
await cdp.call('Log.enable')

const report = {
  pageUrl,
  browser: await fetch(`${cdpBase}/json/version`).then(response => response.json()).then(value => value.Browser),
  checks: {},
}

async function reload() {
  await cdp.call('Page.reload', { ignoreCache: true })
  for (let attempt = 0; attempt < 50; attempt += 1) {
    await delay(100)
    const ready = await cdp.evaluate('document.readyState === "complete" && document.documentElement.dataset.dshOs26 !== undefined')
    if (ready) return
  }
  throw new Error('DSH page did not become ready after reload')
}

try {
  await cdp.evaluate('localStorage.removeItem("dsh-os26.config.v1")')
  await reload()

  const baseline = await cdp.evaluate(`(() => ({
    root: document.documentElement.dataset.dshOs26,
    quality: document.documentElement.dataset.os26Quality,
    styles: document.querySelectorAll('style[data-dsh-os26]').length,
    capsules: document.querySelectorAll('.os26-status-capsule').length,
    state: document.querySelector('.os26-overlay-stack')?.dataset.state,
    opacity: getComputedStyle(document.documentElement).getPropertyValue('--os26-opacity').trim(),
    externalResources: [...performance.getEntriesByType('resource')]
      .map(entry => entry.name)
      .filter(url => { try { return new URL(url).origin !== location.origin } catch { return true } }),
  }))()`)
  assert(baseline.root === 'on', 'plugin root is not enabled')
  assert(baseline.quality === 'balanced', 'Balanced is not the safe default')
  assert(baseline.styles === 1 && baseline.capsules === 1, 'style or capsule mounted more than once')
  assert(baseline.state === 'idle', 'fresh profile did not restore idle state')
  assert(Number(baseline.opacity) >= 0.65, 'readable opacity floor is not active')
  assert(baseline.externalResources.length === 0, `external resources detected: ${baseline.externalResources.join(', ')}`)
  report.checks.baseline = baseline

  const themes = []
  for (const testCase of [
    { scheme: 'light', media: 'light', expectedText: '#17213a' },
    { scheme: 'dark', media: 'dark', expectedText: '#f7f9ff' },
    { scheme: 'system', media: 'light', expectedText: '#17213a' },
    { scheme: 'system', media: 'dark', expectedText: '#f7f9ff' },
  ]) {
    await cdp.call('Emulation.setEmulatedMedia', {
      media: 'screen', features: [{ name: 'prefers-color-scheme', value: testCase.media }],
    })
    await cdp.evaluate(`localStorage.setItem('dsh-os26.config.v1', JSON.stringify({
      version: 1, enabled: true, scheme: '${testCase.scheme}', quality: 'balanced'
    }))`)
    await reload()
    const theme = await cdp.evaluate(`(() => ({
      scheme: document.documentElement.dataset.os26Scheme,
      mediaLight: matchMedia('(prefers-color-scheme: light)').matches,
      text: getComputedStyle(document.documentElement).getPropertyValue('--os26-text').trim(),
    }))()`)
    assert(theme.scheme === testCase.scheme, `theme scheme did not apply: ${JSON.stringify(theme)}`)
    assert(theme.text.toLowerCase() === testCase.expectedText, `theme text palette mismatch: ${JSON.stringify(theme)}`)
    themes.push({ ...testCase, ...theme })
  }
  report.checks.themes = themes

  await cdp.call('Emulation.setEmulatedMedia', { media: 'screen', features: [] })
  const qualityTiers = []
  for (const quality of ['eco', 'balanced', 'cinematic']) {
    await cdp.evaluate(`localStorage.setItem('dsh-os26.config.v1', JSON.stringify({
      version: 1, enabled: true, scheme: 'system', quality: '${quality}'
    }))`)
    await reload()
    const tier = await cdp.evaluate(`(() => {
      const mark = document.querySelector('.os26-state-mark')
      const capsule = document.querySelector('.os26-status-capsule')
      const capsuleStyle = getComputedStyle(capsule)
      return {
        quality: document.documentElement.dataset.os26Quality,
        svgFilters: document.querySelectorAll('#os26-fluid-optic').length,
        animation: getComputedStyle(mark).animationName,
        backdrop: capsuleStyle.backdropFilter || capsuleStyle.webkitBackdropFilter,
      }
    })()`)
    assert(tier.quality === quality, `quality tier did not apply: ${JSON.stringify(tier)}`)
    if (quality === 'eco') assert(tier.animation === 'none' && tier.backdrop === 'none', 'Eco is not static/opaque')
    if (quality === 'balanced') assert(tier.svgFilters === 0, 'Balanced mounted Cinematic SVG')
    if (quality === 'cinematic') assert(tier.svgFilters === 1, 'Cinematic SVG filter is missing')
    qualityTiers.push(tier)
  }
  report.checks.qualityTiers = qualityTiers
  await cdp.evaluate('localStorage.removeItem("dsh-os26.config.v1")')
  await reload()

  await cdp.call('Performance.enable')
  await cdp.evaluate(`(() => {
    window.__os26LongTasks = []
    window.__os26LongTaskObserver = typeof PerformanceObserver === 'function'
      ? new PerformanceObserver(list => window.__os26LongTasks.push(...list.getEntries().map(entry => entry.duration)))
      : null
    window.__os26LongTaskObserver?.observe({ type: 'longtask', buffered: false })
  })()`)
  const metricMap = metrics => Object.fromEntries(metrics.metrics.map(metric => [metric.name, metric.value]))
  const beforeMetrics = metricMap(await cdp.call('Performance.getMetrics'))
  await delay(2500)
  const afterMetrics = metricMap(await cdp.call('Performance.getMetrics'))
  const idlePerformance = await cdp.evaluate(`(() => {
    window.__os26LongTaskObserver?.disconnect()
    const durations = window.__os26LongTasks ?? []
    delete window.__os26LongTaskObserver
    delete window.__os26LongTasks
    return { longTasks: durations.length, longestLongTaskMs: Math.max(0, ...durations) }
  })()`)
  idlePerformance.windowMs = 2500
  idlePerformance.wholePageScriptMs = (afterMetrics.ScriptDuration - beforeMetrics.ScriptDuration) * 1000
  idlePerformance.wholePageTaskMs = (afterMetrics.TaskDuration - beforeMetrics.TaskDuration) * 1000
  idlePerformance.heapDeltaBytes = afterMetrics.JSHeapUsedSize - beforeMetrics.JSHeapUsedSize
  assert(idlePerformance.longTasks === 0, 'idle page produced a long task')
  assert(idlePerformance.wholePageScriptMs < 100, `idle whole-page script exceeded budget: ${JSON.stringify(idlePerformance)}`)
  assert(idlePerformance.wholePageTaskMs < 250, `idle whole-page task time exceeded budget: ${JSON.stringify(idlePerformance)}`)
  report.checks.idlePerformanceUpperBound = idlePerformance

  const viewports = []
  for (const metrics of [
    { width: 1920, height: 1080, deviceScaleFactor: 1 },
    { width: 1440, height: 900, deviceScaleFactor: 1 },
    { width: 1280, height: 800, deviceScaleFactor: 1.25 },
    { width: 768, height: 700, deviceScaleFactor: 2 },
  ]) {
    await cdp.call('Emulation.setDeviceMetricsOverride', { ...metrics, mobile: false })
    const bounds = await cdp.evaluate(`(() => {
      const rect = document.querySelector('.os26-overlay-stack').getBoundingClientRect()
      return { viewport: [innerWidth, innerHeight], rect: [rect.left, rect.top, rect.right, rect.bottom], inside:
        rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight }
    })()`)
    assert(bounds.inside, `overlay left the viewport at ${metrics.width}x${metrics.height}`)
    viewports.push({ ...metrics, ...bounds })
  }
  report.checks.viewports = viewports

  await cdp.call('Emulation.setEmulatedMedia', {
    media: 'screen', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  const reducedMotion = await cdp.evaluate(`(() => {
    const mark = document.querySelector('.os26-state-mark')
    return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      animation: getComputedStyle(mark).animationName }
  })()`)
  assert(reducedMotion.matches && reducedMotion.animation === 'none', 'reduced motion did not remove animation')
  report.checks.reducedMotion = reducedMotion

  await cdp.call('Emulation.setEmulatedMedia', {
    media: 'screen', features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  })
  const reducedTransparency = await cdp.evaluate(`(() => {
    const capsule = document.querySelector('.os26-status-capsule')
    const style = getComputedStyle(capsule)
    return { matches: matchMedia('(prefers-reduced-transparency: reduce)').matches,
      backdrop: style.backdropFilter || style.webkitBackdropFilter }
  })()`)
  assert(reducedTransparency.matches && reducedTransparency.backdrop === 'none', 'reduced transparency kept backdrop filtering')
  report.checks.reducedTransparency = reducedTransparency
  await cdp.call('Emulation.setEmulatedMedia', { media: 'screen', features: [] })

  await cdp.call('Emulation.clearDeviceMetricsOverride')
  await cdp.evaluate(`(() => {
    const continueButton = [...document.querySelectorAll('button')].find(button => button.innerText.includes('继续'))
    continueButton?.click()
  })()`)
  await delay(250)
  await cdp.evaluate(`(() => {
    const laterButton = [...document.querySelectorAll('button')].find(button => button.innerText.includes('稍后配置'))
    laterButton?.click()
  })()`)
  await delay(250)
  await cdp.evaluate(`(() => {
    [...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === '打开侧边栏')?.click()
  })()`)
  await delay(250)
  await cdp.evaluate(`(() => {
    [...document.querySelectorAll('button')].find(button => button.innerText.trim() === '设置')?.click()
  })()`)
  await delay(250)
  await cdp.evaluate(`(() => {
    [...document.querySelectorAll('button')].find(button => button.innerText.trim() === 'DSH-OS26')?.click()
  })()`)
  await delay(250)

  const settings = await cdp.evaluate(`(() => {
    const panel = document.querySelector('.os26-settings')
    if (!panel) return null
    const controls = [...panel.querySelectorAll('input,select,button')]
    return {
      controls: controls.length,
      unnamed: controls.filter(control => {
        const label = control.closest('label')?.innerText.trim()
        return !label && !control.innerText?.trim() && !control.getAttribute('aria-label')
      }).length,
      disclaimer: panel.innerText.includes('与 DeepSeek 或 Apple 无隶属或背书关系'),
    }
  })()`)
  assert(settings && settings.controls >= 14, 'native settings panel is incomplete')
  assert(settings.unnamed === 0, 'settings contain unnamed controls')
  assert(settings.disclaimer, 'independence disclaimer is missing')
  report.checks.settings = settings

  const liveSchemeSwitch = []
  for (const scheme of ['light', 'dark', 'system']) {
    const result = await cdp.evaluate(`(() => {
      const select = [...document.querySelectorAll('.os26-settings select')]
        .find(control => [...control.options].some(option => option.value === '${scheme}'))
      select.value = '${scheme}'
      select.dispatchEvent(new Event('change', { bubbles: true }))
      return new Promise(resolve => requestAnimationFrame(() => resolve({
        requested: '${scheme}', applied: document.documentElement.dataset.os26Scheme,
        styles: document.querySelectorAll('style[data-dsh-os26]').length,
        capsules: document.querySelectorAll('.os26-status-capsule').length,
      })))
    })()`)
    assert(result.applied === scheme && result.styles === 1 && result.capsules === 1,
      `live scheme switch left stale or duplicate UI: ${JSON.stringify(result)}`)
    liveSchemeSwitch.push(result)
  }
  report.checks.liveSchemeSwitch = liveSchemeSwitch

  const focusable = await cdp.evaluate(`(() => {
    const controls = [...document.querySelector('.os26-settings').querySelectorAll('input,select,button')]
    controls[0]?.focus()
    return { count: controls.length, firstFocused: document.activeElement === controls[0] }
  })()`)
  assert(focusable.firstFocused, 'first settings control cannot receive focus')
  const keyboardOrder = []
  const focusIndicators = []
  for (let index = 0; index < focusable.count; index += 1) {
    const focusState = await cdp.evaluate(`(() => {
      const active = document.activeElement
      const controls = [...document.querySelector('.os26-settings').querySelectorAll('input,select,button')]
      const target = active.type === 'file' ? active.closest('label') : active
      const style = getComputedStyle(target)
      return { index: controls.indexOf(active), outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth, outlineColor: style.outlineColor }
    })()`)
    keyboardOrder.push(focusState.index)
    focusIndicators.push(focusState)
    await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  }
  assert(keyboardOrder.every((value, index) => value === index), `Tab order is not sequential: ${keyboardOrder.join(',')}`)
  assert(focusIndicators.every(item => item.outlineStyle !== 'none' && Number.parseFloat(item.outlineWidth) >= 2),
    `a settings control lacks a visible focus ring: ${JSON.stringify(focusIndicators)}`)
  report.checks.keyboard = { traversed: keyboardOrder.length, unique: new Set(keyboardOrder).size }
  report.checks.focusIndicators = focusIndicators

  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 720, height: 450, deviceScaleFactor: 2, mobile: false,
  })
  const effective200Percent = await cdp.evaluate(`(async () => {
    const buttons = [...document.querySelectorAll('.os26-settings-actions button')]
    const results = []
    for (const button of buttons) {
      button.scrollIntoView({ block: 'center' })
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const rect = button.getBoundingClientRect()
      results.push({ text: button.innerText, rect: [rect.left, rect.top, rect.right, rect.bottom],
        visible: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight })
    }
    return { viewport: [innerWidth, innerHeight], actions: results }
  })()`)
  assert(effective200Percent.actions.length === 2 && effective200Percent.actions.every(action => action.visible),
    `critical settings actions fail effective 200% layout: ${JSON.stringify(effective200Percent)}`)
  report.checks.effective200PercentLayout = effective200Percent
  await cdp.call('Emulation.clearDeviceMetricsOverride')

  await cdp.evaluate(`document.querySelector('.os26-settings input[type=checkbox]').click()`)
  await delay(100)
  const disabled = await cdp.evaluate(`({
    root: document.documentElement.dataset.dshOs26,
    capsules: document.querySelectorAll('.os26-status-capsule').length,
    token: getComputedStyle(document.documentElement).getPropertyValue('--dsw-alias-bg-layer-1').trim(),
    privateVariables: ['--os26-opacity', '--os26-blur', '--os26-wallpaper', '--os26-pointer-x']
      .filter(name => document.documentElement.style.getPropertyValue(name) !== ''),
  })`)
  assert(disabled.root === 'off' && disabled.capsules === 0 && disabled.token === ''
    && disabled.privateVariables.length === 0, 'master switch left visual residue')
  await cdp.evaluate(`document.querySelector('.os26-settings input[type=checkbox]').click()`)
  await delay(100)
  const enabled = await cdp.evaluate(`({
    root: document.documentElement.dataset.dshOs26,
    capsules: document.querySelectorAll('.os26-status-capsule').length,
  })`)
  assert(enabled.root === 'on' && enabled.capsules === 1, 'master switch did not restore the plugin')
  report.checks.lifecycle = { disabled, enabled }

  const pageExceptions = cdp.exceptions.filter(exception =>
    !exception.url.startsWith('chrome-extension://')
    && !exception.description.includes('chrome-extension://'))
  assert(pageExceptions.length === 0, `page exceptions: ${JSON.stringify(pageExceptions)}`)
  report.checks.browserExceptions = { page: pageExceptions, ignoredExtensions: cdp.exceptions.length - pageExceptions.length }
  if (screenshotPath) {
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    })
    const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png', fromSurface: true })
    await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
    report.screenshot = screenshotPath
  }
  console.log(JSON.stringify(report, null, 2))
} finally {
  cdp.close()
}
