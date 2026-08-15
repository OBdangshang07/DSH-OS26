import process from 'node:process'
import { writeFile } from 'node:fs/promises'

const args = new Map()
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1])
const pageUrl = args.get('--url') ?? 'http://127.0.0.1:3080'
const cdpBase = args.get('--cdp') ?? 'http://127.0.0.1:9229'
const screenshotPrefix = args.get('--screenshot-prefix')
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

async function waitFor(expression, label, timeout = 120000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await cdp.evaluate(expression)
    if (value) return value
    await delay(250)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

async function pressEscape() {
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
}

async function newSession() {
  await pressEscape()
  const result = await cdp.evaluate(`(() => {
    const sidebar = document.querySelector('[data-slot="sidebar"]')
    const stableTitle = item => {
      const lines = item.innerText.trim().split(/\\n+/)
      if (/^(等待回答|计划待审|等待审批)$/.test(lines[0] ?? '')) lines.shift()
      if (/^(刚刚|\d+\s*(?:秒|分钟|小时|天))$/.test(lines.at(-1) ?? '')) lines.pop()
      return lines.join('\\n')
    }
    const previousItems = [...(sidebar?.querySelectorAll('[role="treeitem"]') ?? [])]
      .filter(item => item.hasAttribute('aria-selected'))
      .map(stableTitle)
    const button = [...(sidebar?.querySelectorAll('button') ?? [])]
      .find(item => /^(新会话|New Session)$/i.test(item.innerText.trim()))
    button?.click()
    return { created: Boolean(button), previousItems }
  })()`)
  if (!result.created) throw new Error('New Session action is unavailable')
  await waitFor(`Boolean(document.querySelector('[data-composer-card] textarea:not(:disabled)'))`, 'new-session composer')
  return result.previousItems
}

async function waitForInteraction(selector, label, previousItems, timeout = 120000) {
  const deadline = Date.now() + timeout
  let clicked = false
  const fallbackAt = Date.now() + 8000
  while (Date.now() < deadline) {
    const state = await cdp.evaluate(`(() => {
      const prior = new Set(${JSON.stringify(previousItems)})
      const stableTitle = item => {
        const lines = item.innerText.trim().split(/\\n+/)
        if (/^(等待回答|计划待审|等待审批)$/.test(lines[0] ?? '')) lines.shift()
        if (/^(刚刚|\d+\s*(?:秒|分钟|小时|天))$/.test(lines.at(-1) ?? '')) lines.pop()
        return lines.join('\\n')
      }
      const items = [...document.querySelectorAll('[data-slot="sidebar"] [role="treeitem"]')]
        .filter(item => item.hasAttribute('aria-selected'))
      const fresh = items.find(item => !prior.has(stableTitle(item)))
      return { found: Boolean(document.querySelector(${JSON.stringify(selector)})), fresh: fresh ? stableTitle(fresh) : null }
    })()`)
    if (state.found) return true
    if (!clicked && (state.fresh || Date.now() >= fallbackAt)) {
      await cdp.evaluate(`(() => {
        const prior = new Set(${JSON.stringify(previousItems)})
        const stableTitle = candidate => {
          const lines = candidate.innerText.trim().split(/\\n+/)
          if (/^(等待回答|计划待审|等待审批)$/.test(lines[0] ?? '')) lines.shift()
          if (/^(刚刚|\d+\s*(?:秒|分钟|小时|天))$/.test(lines.at(-1) ?? '')) lines.pop()
          return lines.join('\\n')
        }
        const items = [...document.querySelectorAll('[data-slot="sidebar"] [role="treeitem"]')]
          .filter(candidate => candidate.hasAttribute('aria-selected'))
        const item = items.find(candidate => !prior.has(stableTitle(candidate)))
          ?? items.find(candidate => /^(等待回答|计划待审|等待审批)/.test(candidate.innerText.trim()))
        item?.click()
        return Boolean(item)
      })()`)
      clicked = true
    }
    await delay(250)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

async function submit(text) {
  await cdp.evaluate(`(() => {
    const textarea = document.querySelector('[data-composer-card] textarea')
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    setter.call(textarea, ${JSON.stringify(text)})
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(text)} }))
    textarea.focus()
  })()`)
  await waitFor(`(() => {
    const buttons = document.querySelectorAll('[data-composer-card] button')
    return buttons.item(buttons.length - 1)?.disabled === false
  })()`, 'send action')
  const sent = await cdp.evaluate(`(() => {
    const buttons = document.querySelectorAll('[data-composer-card] button')
    const button = buttons.item(buttons.length - 1)
    button?.click()
    return Boolean(button && !button.disabled)
  })()`)
  if (!sent) throw new Error('Prompt was not submitted')
}

async function snapshot(selector, scrollSelector) {
  return cdp.evaluate(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)})
    const card = root?.querySelector('section')
    const scroll = root?.querySelector(${JSON.stringify(scrollSelector)})
    if (!root || !card) return null
    const rect = card.getBoundingClientRect()
    const style = getComputedStyle(card)
    return {
      text: root.innerText,
      rect: [rect.left, rect.top, rect.right, rect.bottom],
      inside: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight,
      border: style.borderTopWidth,
      radius: style.borderTopLeftRadius,
      backdrop: style.backdropFilter || style.webkitBackdropFilter,
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
      scrollOverflow: scroll ? scroll.scrollHeight - scroll.clientHeight : 0,
      state: document.querySelector('.os26-overlay-stack')?.dataset.state,
      competingOverlays: document.querySelectorAll('.os26-status-capsule, .os26-attention-surface').length,
      buttons: [...root.querySelectorAll('button')].map(button => ({
        text: button.innerText.trim(),
        role: button.getAttribute('role'),
        label: button.getAttribute('aria-label'),
        checked: button.getAttribute('aria-checked'),
        disabled: button.disabled,
      })),
    }
  })()`)
}

async function diagnosticSnapshot() {
  return cdp.evaluate(`(() => ({
    location: location.href,
    composerValue: document.querySelector('[data-composer-card] textarea')?.value,
    questionCount: document.querySelectorAll('[data-question-key]').length,
    planReviewCount: document.querySelectorAll('[data-plan-review-key]').length,
    tools: [...document.querySelectorAll('[data-tool][data-variant]')].slice(-6).map(tool => ({
      text: tool.innerText.slice(0, 300),
      state: tool.dataset.state,
      variant: tool.dataset.variant,
    })),
    pageTail: document.body.innerText.slice(-2600),
    overlayState: document.querySelector('.os26-overlay-stack')?.dataset.state,
    active: {
      tag: document.activeElement?.tagName,
      label: document.activeElement?.getAttribute('aria-label'),
      insideComposer: Boolean(document.activeElement?.closest('[data-composer-card]')),
    },
    treeItems: [...document.querySelectorAll('[data-slot="sidebar"] [role="treeitem"]')].slice(0, 30).map(item => ({
      text: item.innerText.trim(),
      selected: item.getAttribute('aria-selected'),
      level: item.getAttribute('aria-level'),
      key: item.getAttribute('data-key'),
      value: item.getAttribute('data-value'),
      id: item.id,
    })),
  }))()`)
}

function assertSurface(surface, expectedText, kind) {
  if (!surface?.text.includes(expectedText)) throw new Error(`${kind} did not contain ${expectedText}: ${surface?.text}`)
  if (!surface.inside || surface.pageOverflow > 1 || surface.competingOverlays !== 0
    || Number.parseFloat(surface.radius) < 16 || !surface.backdrop.includes('blur(')) {
    throw new Error(`${kind} layout failed: ${JSON.stringify(surface)}`)
  }
}

async function capture(suffix) {
  if (!screenshotPrefix) return undefined
  const path = `${screenshotPrefix}-${suffix}.png`
  const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png', fromSurface: true })
  await writeFile(path, Buffer.from(screenshot.data, 'base64'))
  return path
}

async function accessibilitySnapshot(selector) {
  const exists = await cdp.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)
  if (!exists) throw new Error(`Could not resolve accessibility root for ${selector}`)
  const tree = await cdp.call('Accessibility.getFullAXTree')
  const relevantRoles = new Set(['heading', 'radio', 'checkbox', 'button', 'textbox'])
  return tree.nodes.filter(node => node.ignored !== true && relevantRoles.has(node.role?.value)).map(node => ({
      role: node.role?.value ?? '',
      name: node.name?.value ?? '',
      disabled: node.properties?.find(property => property.name === 'disabled')?.value?.value ?? false,
      checked: node.properties?.find(property => property.name === 'checked')?.value?.value ?? null,
    }))
}

function assertAccessibility(nodes, requirements, kind) {
  for (const requirement of requirements) {
    const found = nodes.some(node => node.role === requirement.role && requirement.name.test(node.name))
    if (!found) throw new Error(`${kind} accessibility tree is missing ${requirement.role} ${requirement.name}: ${JSON.stringify(nodes)}`)
  }
}

async function dismissAndSettle(selector, label) {
  const focusAfterResolve = await waitFor(`(() => {
    if (document.querySelector(${JSON.stringify(selector)})) return null
    return {
      tag: document.activeElement?.tagName,
      label: document.activeElement?.getAttribute('aria-label'),
      insideComposer: Boolean(document.activeElement?.closest('[data-composer-card]')),
    }
  })()`, `${label} dismissal`)
  const settled = await waitFor(`(() => {
    const textarea = document.querySelector('[data-composer-card] textarea')
    const buttons = document.querySelectorAll('[data-composer-card] button')
    const send = buttons.item(buttons.length - 1)
    const state = document.querySelector('.os26-overlay-stack')?.dataset.state
    return textarea?.value === '' && send?.disabled && ['idle','success','error'].includes(state) ? {
      state,
      focusTag: document.activeElement?.tagName,
      focusInsideComposer: Boolean(document.activeElement?.closest('[data-composer-card]')),
    } : null
  })()`, `${label} settlement`)
  return { focusAfterResolve, settled }
}

if (args.get('--diagnose-only') === 'true') {
  await cdp.call('Runtime.enable')
  const openTitle = args.get('--open-title')
  if (openTitle) {
    await cdp.evaluate(`(() => {
      const item = [...document.querySelectorAll('[data-slot="sidebar"] [role="treeitem"]')]
        .find(element => element.innerText.trim().startsWith(${JSON.stringify(openTitle)}))
      item?.click()
      return Boolean(item)
    })()`)
    await delay(750)
  }
  if (args.get('--resolve-question') === 'true') {
    const selected = await cdp.evaluate(`(() => {
      const root = document.querySelector('[data-question-key]')
      const option = [...(root?.querySelectorAll('[role="radio"]') ?? [])]
        .find(button => button.getAttribute('aria-label') === 'Balanced Glass')
      option?.click()
      return Boolean(option)
    })()`)
    if (selected) {
      await waitFor(`(() => {
        const root = document.querySelector('[data-question-key]')
        const submit = [...root.querySelectorAll('button')]
          .find(button => /^(提交|Submit)$/.test(button.innerText.trim()))
        return submit?.disabled === false
      })()`, 'diagnostic question submit')
      await cdp.evaluate(`(() => {
      const root = document.querySelector('[data-question-key]')
      const submit = [...(root?.querySelectorAll('button') ?? [])]
        .find(button => /^(提交|Submit)$/.test(button.innerText.trim()))
      submit?.click()
      return Boolean(submit)
    })()`)
    }
    await delay(1500)
  }
  if (args.get('--resolve-plan') === 'true') {
    await cdp.evaluate(`(() => {
      const root = document.querySelector('[data-plan-review-key]')
      const button = [...(root?.querySelectorAll('button') ?? [])]
        .find(item => /^(确认执行|Approve)$/.test(item.innerText.trim()))
      button?.click()
      return Boolean(button)
    })()`)
    await delay(1500)
  }
  console.log(JSON.stringify(await diagnosticSnapshot(), null, 2))
  cdp.close()
  process.exit(0)
}

const report = { pageUrl }
try {
  await cdp.call('Runtime.enable')
  await cdp.call('Page.enable')
  await cdp.call('Accessibility.enable')
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })

  console.log('Starting real question flow')
  const questionPreviousItems = await newSession()
  await submit('Use ask_user_question now. Ask exactly one single-select question with id os26_material, header Material, and question "Which material should the release candidate use?" Provide exactly two options: "Balanced Glass (Recommended)" described as "Readable refraction" and "Opaque Glass" described as "Maximum contrast". Do not answer it yourself. After I answer, reply with the selected label only.')
  try {
    await waitForInteraction('[data-question-key]', 'question surface', questionPreviousItems)
  } catch (error) {
    console.error(JSON.stringify(await diagnosticSnapshot(), null, 2))
    throw error
  }
  const question = await snapshot('[data-question-key]', '[data-question-scroll]')
  assertSurface(question, 'Which material should the release candidate use?', 'Question')
  const questionAccessibility = await accessibilitySnapshot('[data-question-key]')
  assertAccessibility(questionAccessibility, [
    { role: 'heading', name: /Which material should the release candidate use\?/ },
    { role: 'radio', name: /^Balanced Glass$/ },
    { role: 'radio', name: /^Opaque Glass$/ },
    { role: 'button', name: /^(提交|Submit)$/ },
  ], 'Question')
  const questionScreenshot = await capture('question')
  const selected = await cdp.evaluate(`(() => {
    const root = document.querySelector('[data-question-key]')
    const option = [...root.querySelectorAll('[role="radio"]')].find(button => button.getAttribute('aria-label') === 'Balanced Glass')
    option?.click()
    return Boolean(option)
  })()`)
  if (!selected) throw new Error(`Could not safely select question option: ${JSON.stringify(question.buttons)}`)
  await waitFor(`(() => {
    const root = document.querySelector('[data-question-key]')
    const option = [...root.querySelectorAll('[role="radio"]')].find(button => button.getAttribute('aria-label') === 'Balanced Glass')
    const submit = [...root.querySelectorAll('button')].find(button => /^(提交|Submit)$/.test(button.innerText.trim()))
    return option?.getAttribute('aria-checked') === 'true' && submit?.disabled === false
  })()`, 'selected question option')
  const answered = await cdp.evaluate(`(() => {
    const root = document.querySelector('[data-question-key]')
    const submit = [...root.querySelectorAll('button')].find(button => /^(提交|Submit)$/.test(button.innerText.trim()))
    submit?.click()
    return Boolean(submit && !submit.disabled)
  })()`)
  if (!answered) throw new Error(`Could not safely answer question: ${JSON.stringify(question.buttons)}`)
  const questionResult = await dismissAndSettle('[data-question-key]', 'question')
  report.question = { surface: question, accessibility: questionAccessibility, ...questionResult, screenshot: questionScreenshot }
  console.log(`Finished real question flow: ${questionResult.settled.state}`)

  console.log('Starting real plan-review flow')
  const planPreviousItems = await newSession()
  await submit('/plan Create a concise two-step plan titled OS26-PLAN-REVIEW. Step 1: acknowledge the user-supplied marker OS26. Step 2: reply with PLAN-APPROVED. The plan must use no tools, files, shell, network, or external state. Call exit_plan_mode immediately after presenting it so the official plan-review UI appears.')
  try {
    await waitForInteraction('[data-plan-review-key]', 'plan-review surface', planPreviousItems)
  } catch (error) {
    console.error(JSON.stringify(await diagnosticSnapshot(), null, 2))
    throw error
  }
  const planReview = await snapshot('[data-plan-review-key]', '[data-plan-review-scroll]')
  assertSurface(planReview, 'OS26-PLAN-REVIEW', 'Plan review')
  const planAccessibility = await accessibilitySnapshot('[data-plan-review-key]')
  assertAccessibility(planAccessibility, [
    { role: 'heading', name: /^OS26-PLAN-REVIEW$/ },
    { role: 'button', name: /^(去聊天里说|Chat about it)$/ },
    { role: 'button', name: /^(拒绝|Refuse)$/ },
    { role: 'button', name: /^(确认执行|Approve)$/ },
  ], 'Plan review')
  const planScreenshot = await capture('plan-review')
  const approved = await cdp.evaluate(`(() => {
    const root = document.querySelector('[data-plan-review-key]')
    const button = [...root.querySelectorAll('button')].find(item => /^(确认执行|Approve)$/.test(item.innerText.trim()))
    button?.click()
    return Boolean(button)
  })()`)
  if (!approved) throw new Error(`Could not safely approve plan review: ${JSON.stringify(planReview.buttons)}`)
  const planResult = await dismissAndSettle('[data-plan-review-key]', 'plan review')
  report.planReview = { surface: planReview, accessibility: planAccessibility, ...planResult, screenshot: planScreenshot }
  console.log(`Finished real plan-review flow: ${planResult.settled.state}`)

  const pageExceptions = cdp.exceptions.filter(exception => !exception.exception?.description?.includes('chrome-extension://'))
  if (pageExceptions.length) throw new Error(`Page exceptions: ${JSON.stringify(pageExceptions)}`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  cdp.close()
}
