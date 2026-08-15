import assert from 'node:assert/strict'
import test from 'node:test'
import { createSignalStore, deriveSemanticState } from '../src/client/state.js'

test('semantic state precedence follows user safety first', () => {
  assert.equal(deriveSemanticState({ running: true, runningCalls: [{}], pendingInteraction: 'approval' }).state, 'approval')
  assert.equal(deriveSemanticState({ running: true, runningCalls: [{}], pendingInteraction: 'question' }).state, 'blocked')
  assert.equal(deriveSemanticState({ running: true, runningCalls: [{}] }).state, 'tool-running')
  assert.equal(deriveSemanticState({ running: true }).state, 'thinking')
  assert.equal(deriveSemanticState({ running: false, lastAgentError: new Error('x') }).state, 'error')
  assert.equal(deriveSemanticState({ running: false }).state, 'idle')
})

test('pending carriers are recognized without relying on summary state', () => {
  assert.equal(deriveSemanticState({ pending: [{ kind: 'approval' }] }).state, 'approval')
  assert.equal(deriveSemanticState({ pending: [{ type: 'plan-review' }] }).state, 'blocked')
})

test('a real active-to-idle transition produces a bounded success receipt', () => {
  let snapshot = { running: true }
  const listeners = new Set()
  const session = {
    getSnapshot: () => snapshot,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn) },
  }
  const current = {
    getSnapshot: () => ({ sessionId: 's1', hooks: { session } }),
    subscribe: () => () => {},
  }
  let callback
  const timers = { setTimeout: fn => { callback = fn; return 1 }, clearTimeout: () => {} }
  const store = createSignalStore(current, timers)
  assert.equal(store.getSnapshot().state, 'thinking')
  snapshot = { running: false }
  for (const listener of listeners) listener()
  assert.equal(store.getSnapshot().state, 'success')
  callback()
  assert.equal(store.getSnapshot().state, 'idle')
  store.dispose()
  assert.equal(listeners.size, 0)
})
