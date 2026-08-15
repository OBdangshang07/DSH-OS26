import assert from 'node:assert/strict'
import test from 'node:test'
import { installInteractionFocusReturn } from '../src/client/index.js'

function harness({ enabled = true, active = 'body', conflict = false } = {}) {
  const body = { id: 'body' }
  const documentElement = { id: 'root' }
  const composer = { focused: 0, focus() { this.focused += 1 } }
  let approval = {}
  let callback
  const document = {
    body,
    documentElement,
    activeElement: active === 'body' ? body : { id: 'button' },
  }
  const root = {
    querySelectorAll(selector) {
      if (selector === '[data-approval-key]') return approval ? [approval] : []
      if (selector.includes('[data-approval-key]')) return approval ? [approval] : (conflict ? [{}] : [])
      if (selector === '[data-composer-card] textarea:not(:disabled)') return [composer]
      return []
    },
  }
  class MutationObserver {
    constructor(next) { callback = next }
    observe() {}
    disconnect() {}
  }
  const environment = {
    document,
    MutationObserver,
    requestAnimationFrame(run) { run(); return 1 },
    cancelAnimationFrame() {},
  }
  const dispose = installInteractionFocusReturn(root, () => enabled, environment)
  const removeApproval = () => {
    approval = null
    callback()
  }
  return { composer, dispose, removeApproval }
}

test('returns focus to the composer after a native decision disappears from BODY', () => {
  const value = harness()
  value.removeApproval()
  assert.equal(value.composer.focused, 1)
  value.dispose()
})

test('does not steal focus when another control or modal owns it', () => {
  const focused = harness({ active: 'control' })
  focused.removeApproval()
  assert.equal(focused.composer.focused, 0)
  focused.dispose()

  const modal = harness({ conflict: true })
  modal.removeApproval()
  assert.equal(modal.composer.focused, 0)
  modal.dispose()
})
