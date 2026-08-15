import process from 'node:process'
import { writeFile } from 'node:fs/promises'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1])
const pageUrl = args.get('--url') ?? 'http://127.0.0.1:3080'
const cdpBase = args.get('--cdp') ?? 'http://127.0.0.1:9229'
const screenshotPrefix = args.get('--screenshot-prefix')
const prompt = 'Run the exact read-only PowerShell expression [System.IO.Path]::GetTempPath(). It may be denied by Read Only ConstrainedLanguage; if that happens, retry the exact same expression once with the narrowest wider sandbox_permissions and a clear justification so the official approval UI appears. Do not create, modify, or delete any file.'
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
      if (message.method === 'Runtime.exceptionThrown') this.exceptions.push(message.params.exceptionDetails)
      if (!message.id) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result)
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

async function pressEscape() {
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
}

async function waitFor(expression, label, timeout = 90000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await cdp.evaluate(expression)
    if (value) return value
    await delay(250)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

async function newReadOnlySession() {
  await pressEscape()
  const created = await cdp.evaluate(`(() => {
    const button = document.querySelector('[data-slot="sidebar"] > * > button')
    button?.click()
    return Boolean(button)
  })()`)
  if (!created) throw new Error('New Session action is unavailable')
  await delay(450)
  const selected = await cdp.evaluate(`(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
    const card = document.querySelector('[data-composer-card]')
    const trigger = [...(card?.querySelectorAll('button') ?? [])]
      .find(button => !button.getAttribute('aria-haspopup') && button.innerText.trim())
    if (!trigger) return null
    trigger.click()
    await wait(100)
    const popup = [...document.querySelectorAll('[role="menu"]')]
      .filter(element => element.getBoundingClientRect().width > 0).at(-1)
    const item = [...(popup?.querySelectorAll('[role="menuitem"]') ?? [])]
      .find(option => option.innerText.trim() === 'Read Only')
    item?.click()
    await wait(80)
    return item ? { mode: trigger.innerText.trim(), session: document.querySelector('[data-slot="sidebar"] [role="treeitem"][aria-selected="true"]')?.innerText } : null
  })()`)
  if (!selected || selected.mode !== 'Read Only') throw new Error(`Could not select Read Only mode: ${JSON.stringify(selected)}`)
  return selected
}

async function submitPrompt() {
  const ready = await waitFor(`Boolean(document.querySelector('[data-composer-card] textarea:not(:disabled)'))`, 'composer')
  if (!ready) throw new Error('Composer did not become ready')
  await cdp.evaluate(`(() => {
    const textarea = document.querySelector('[data-composer-card] textarea')
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    setter.call(textarea, ${JSON.stringify(prompt)})
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(prompt)} }))
    textarea.focus()
  })()`)
  await waitFor(`(() => { const buttons = document.querySelectorAll('[data-composer-card] button'); return Boolean(buttons.item(buttons.length - 1)?.disabled === false) })()`, 'send action')
  const sent = await cdp.evaluate(`(() => {
    const buttons = document.querySelectorAll('[data-composer-card] button')
    const button = buttons.item(buttons.length - 1)
    button?.click()
    return Boolean(button && !button.disabled)
  })()`)
  if (!sent) throw new Error('Prompt was not submitted')
}

async function approvalSnapshot() {
  return cdp.evaluate(`(() => {
    const root = document.querySelector('[data-approval-key]')
    const card = root?.firstElementChild
    if (!root || !card) return null
    const rect = card.getBoundingClientRect()
    const style = getComputedStyle(card)
    return {
      text: root.innerText,
      buttons: [...root.querySelectorAll('button')].map(button => button.innerText.trim()),
      rect: [rect.left, rect.top, rect.right, rect.bottom],
      inside: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
      border: style.borderTopWidth,
      radius: style.borderTopLeftRadius,
      backdrop: style.backdropFilter || style.webkitBackdropFilter,
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
      state: document.querySelector('.os26-overlay-stack')?.dataset.state,
      competingOverlays: document.querySelectorAll('.os26-status-capsule, .os26-attention-surface').length,
    }
  })()`)
}

async function diagnosticSnapshot() {
  return cdp.evaluate(`(() => ({
    location: location.href,
    composerValue: document.querySelector('[data-composer-card] textarea')?.value,
    composerButtons: [...(document.querySelectorAll('[data-composer-card] button') ?? [])].map(button => ({
      text: button.innerText.trim(),
      disabled: button.disabled,
      label: button.getAttribute('aria-label'),
    })),
    approvalCount: document.querySelectorAll('[data-approval-key]').length,
    tools: [...document.querySelectorAll('[data-tool][data-variant]')].slice(-5).map(tool => ({
      text: tool.innerText.slice(0, 240),
      state: tool.dataset.state,
      variant: tool.dataset.variant,
    })),
    pageTail: document.body.innerText.slice(-2000),
    overlayState: document.querySelector('.os26-overlay-stack')?.dataset.state,
  }))()`)
}

async function capture(suffix) {
  if (!screenshotPrefix) return undefined
  const path = `${screenshotPrefix}-${suffix}.png`
  const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png', fromSurface: true })
  await writeFile(path, Buffer.from(screenshot.data, 'base64'))
  return path
}

async function resolveApproval(kind) {
  const labels = await cdp.evaluate(`[...document.querySelectorAll('[data-approval-key] button')].map(button => button.innerText.trim())`)
  const matcher = kind === 'deny' ? /拒绝|deny|reject/i : /允许|allow|approve|确认/i
  const index = labels.findIndex(label => matcher.test(label))
  if (index < 0) throw new Error(`Could not safely identify ${kind} action: ${JSON.stringify(labels)}`)
  return cdp.evaluate(`(() => {
    const button = document.querySelectorAll('[data-approval-key] button').item(${index})
    button?.click()
    return Boolean(button)
  })()`)
}

const report = { pageUrl, prompt, flows: [] }
try {
  await cdp.call('Runtime.enable')
  await cdp.call('Page.enable')
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

  for (const outcome of ['deny', 'allow']) {
    console.log(`Starting real ${outcome} flow`)
    const session = await newReadOnlySession()
    await submitPrompt()
    try {
      await waitFor(`Boolean(document.querySelector('[data-approval-key]'))`, `${outcome} approval`, 120000)
    } catch (error) {
      console.error(JSON.stringify(await diagnosticSnapshot(), null, 2))
      throw error
    }
    const approval = await approvalSnapshot()
    if (!approval.text.includes('GetTempPath')) throw new Error(`Approval is not the expected read-only command: ${approval.text}`)
    if (!approval.inside || approval.pageOverflow > 1 || approval.competingOverlays !== 0 || Number.parseFloat(approval.radius) < 16) {
      throw new Error(`Approval layout failed: ${JSON.stringify(approval)}`)
    }
    const screenshot = await capture(`${outcome}-approval`)
    await resolveApproval(outcome)
    const focusAfterResolve = await waitFor(`(() => {
      if (document.querySelector('[data-approval-key]')) return null
      return {
        tag: document.activeElement?.tagName,
        label: document.activeElement?.getAttribute('aria-label'),
        insideComposer: Boolean(document.activeElement?.closest('[data-composer-card]')),
      }
    })()`, `${outcome} approval dismissal`)
    const settled = await waitFor(`(() => {
      if (document.querySelector('[data-approval-key]')) return null
      const state = document.querySelector('.os26-overlay-stack')?.dataset.state
      const tools = [...document.querySelectorAll('[data-tool][data-variant]')]
      const textarea = document.querySelector('[data-composer-card] textarea')
      const buttons = document.querySelectorAll('[data-composer-card] button')
      const send = buttons.item(buttons.length - 1)
      return ['idle','success','error','blocked'].includes(state) && textarea?.value === '' && send?.disabled ? {
        state, tools: tools.length, failed: tools.filter(tool => tool.dataset.state === 'error').length,
        focusTag: document.activeElement?.tagName, focusInsideComposer: Boolean(document.activeElement?.closest('[data-composer-card]')),
      } : null
    })()`, `${outcome} settlement`, 120000)
    report.flows.push({ outcome, session, approval, focusAfterResolve, settled, screenshot })
    console.log(`Finished real ${outcome} flow: ${settled.state}`)
  }
  const pageExceptions = cdp.exceptions.filter(exception => !exception.exception?.description?.includes('chrome-extension://'))
  if (pageExceptions.length) throw new Error(`Page exceptions: ${JSON.stringify(pageExceptions)}`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  cdp.close()
}
