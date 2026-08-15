import process from 'node:process'
import { writeFile } from 'node:fs/promises'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1])
const pageUrl = args.get('--url') ?? 'http://127.0.0.1:3080'
const cdpBase = args.get('--cdp') ?? 'http://127.0.0.1:9229'
const screenshotPath = args.get('--screenshot')
const toolScreenshotPath = args.get('--tool-screenshot')
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

const targets = await fetch(`${cdpBase}/json/list`).then(response => response.json())
const target = targets.find(item => item.type === 'page' && item.url.startsWith(pageUrl))
if (!target?.webSocketDebuggerUrl) throw new Error(`No CDP page found for ${pageUrl}`)

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 0
    this.pending = new Map()
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true })
      this.socket.addEventListener('error', reject, { once: true })
    })
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (!message.id) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
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
    const result = await this.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result.value
  }
  close() { this.socket.close() }
}

const cdp = new Cdp(target.webSocketDebuggerUrl)
await cdp.open()
try {
  await cdp.call('Runtime.enable')
  await cdp.call('Page.enable')
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  })

  const discovery = await cdp.evaluate(`(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    const items = [...document.querySelectorAll('[data-slot="sidebar"] [role="treeitem"]')]
    const original = items.findIndex(item => item.getAttribute('aria-selected') === 'true')
    const attempts = []
    const countSurfaces = () => ({
      tools: document.querySelectorAll('[data-tool][data-variant]').length,
      goals: document.querySelectorAll('[data-goal-bar]').length,
      approvals: document.querySelectorAll('[data-approval-key]').length,
      questions: document.querySelectorAll('[data-question-key]').length,
      planReviews: document.querySelectorAll('[data-plan-review-key]').length,
      errors: document.querySelectorAll('[data-chat-flow-kind="turn-error"]').length,
    })
    const initialCounts = countSurfaces()
    let found = Object.values(initialCounts).some(Boolean) ? { index: original, counts: initialCounts } : null
    for (let index = 0; index < items.length; index += 1) {
      if (found) break
      if (index === original || !items[index].hasAttribute('aria-selected')) continue
      const target = items[index]
      target.click()
      await wait(450)
      const counts = countSurfaces()
      attempts.push({ index, tag: items[index].tagName, target: target.tagName,
        text: items[index].innerText.trim().slice(0, 80), selected: items[index].getAttribute('aria-selected'), counts })
      if (Object.values(counts).some(Boolean)) {
        found = { index, counts }
        break
      }
    }
    return { original, initialCounts, attempts, found }
  })()`)

  if (discovery.found?.counts.tools) {
    await cdp.evaluate(`(() => {
      const tool = [...document.querySelectorAll('[data-tool][data-variant]')]
        .find(candidate => candidate.querySelector('[aria-expanded]'))
      const trigger = tool?.querySelector('[aria-expanded]')
      if (trigger?.getAttribute('aria-expanded') !== 'true') trigger?.click()
    })()`)
    await delay(220)
  }

  const surfaces = await cdp.evaluate(`(() => {
    const styleOf = element => {
      if (!element) return null
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return {
        rect: [rect.left, rect.top, rect.right, rect.bottom],
        border: style.borderTopWidth,
        radius: style.borderTopLeftRadius,
        backdrop: style.backdropFilter || style.webkitBackdropFilter,
        background: style.backgroundImage,
        horizontalOverflow: element.scrollWidth - element.clientWidth,
      }
    }
    const tools = [...document.querySelectorAll('[data-tool][data-variant]')]
    const expandedTool = tools.find(tool => tool.querySelector('[aria-expanded="true"]'))
    const goal = document.querySelector('[data-goal-bar] > div')
    const approval = document.querySelector('[data-approval-key] > div')
    const question = document.querySelector('[data-question-key] > section')
    const planReview = document.querySelector('[data-plan-review-key] > section')
    return {
      counts: {
        tools: tools.length,
        runningTools: tools.filter(tool => tool.dataset.state === 'running').length,
        failedTools: tools.filter(tool => tool.dataset.state === 'error').length,
        goals: goal ? 1 : 0,
        approvals: approval ? 1 : 0,
        questions: question ? 1 : 0,
        planReviews: planReview ? 1 : 0,
        errors: document.querySelectorAll('[data-chat-flow-kind="turn-error"]').length,
      },
      expandedTool: styleOf(expandedTool),
      goal: styleOf(goal),
      approval: styleOf(approval),
      question: styleOf(question),
      planReview: styleOf(planReview),
      generatedTitles: document.querySelectorAll('[data-os26-overflow-title="true"]').length,
      composerControls: [...document.querySelectorAll('[data-composer-card] :is(button,textarea)')].map(control => ({
        tag: control.tagName,
        text: control.innerText?.trim().slice(0, 80) ?? '',
        placeholder: control.getAttribute('placeholder'),
        ariaLabel: control.getAttribute('aria-label'),
        ariaHaspopup: control.getAttribute('aria-haspopup'),
        disabled: control.disabled,
      })),
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
    }
  })()`)

  const permissionMenu = await cdp.evaluate(`(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    const card = document.querySelector('[data-composer-card]')
    const trigger = [...(card?.querySelectorAll('button') ?? [])]
      .find(button => !button.getAttribute('aria-haspopup') && button.innerText.trim())
    if (!trigger) return null
    const before = new Set(document.body.querySelectorAll('*'))
    trigger.click()
    await wait(120)
    const popup = [...document.body.querySelectorAll('[role="menu"], [role="listbox"]')]
      .filter(element => element.getBoundingClientRect().width > 0).at(-1)
    const added = [...document.body.querySelectorAll('*')].filter(element => !before.has(element)
      && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0)
    const result = popup ? {
      role: popup.getAttribute('role'),
      text: popup.innerText,
      options: [...popup.querySelectorAll('[role="menuitem"], [role="option"], button')].map(option => ({
        role: option.getAttribute('role'), text: option.innerText.trim(), checked: option.getAttribute('aria-checked'),
      })),
    } : { added: added.slice(0, 40).map(element => ({ tag: element.tagName, role: element.getAttribute('role'),
      text: element.innerText?.trim().slice(0, 120) ?? '', attrs: Object.fromEntries([...element.attributes].map(attribute => [attribute.name, attribute.value])) })) }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
    return result
  })()`)

  if (surfaces.pageOverflow > 1) throw new Error(`Runtime page overflow: ${surfaces.pageOverflow}px`)
  for (const [name, surface] of Object.entries(surfaces)) {
    if (!surface || typeof surface !== 'object' || !('horizontalOverflow' in surface)) continue
    if (surface.horizontalOverflow > 1) throw new Error(`${name} overflows horizontally: ${surface.horizontalOverflow}px`)
    if (Number.parseFloat(surface.radius) < 10) throw new Error(`${name} is missing OS26 geometry`)
  }

  if (screenshotPath && discovery.found) {
    const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png', fromSurface: true })
    await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  }
  if (toolScreenshotPath && surfaces.counts.tools) {
    await cdp.evaluate(`document.querySelector('[data-tool][data-variant]:has([aria-expanded="true"])')?.scrollIntoView({ block: 'center' })`)
    await delay(180)
    const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png', fromSurface: true })
    await writeFile(toolScreenshotPath, Buffer.from(screenshot.data, 'base64'))
  }
  if (discovery.original >= 0) {
    await cdp.evaluate(`document.querySelectorAll('[data-slot="sidebar"] [role="treeitem"]').item(${discovery.original})?.click()`)
  }
  console.log(JSON.stringify({ pageUrl, discovery, surfaces, permissionMenu, screenshot: screenshotPath, toolScreenshot: toolScreenshotPath }, null, 2))
} finally {
  cdp.close()
}
