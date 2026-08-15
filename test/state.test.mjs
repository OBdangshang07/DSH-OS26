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
  for (const listener of listeners) listener()
  assert.equal(store.getSnapshot().state, 'success')
  callback()
  assert.equal(store.getSnapshot().state, 'idle')
  store.dispose()
  assert.equal(listeners.size, 0)
})

test('duplicate session projections do not repeat semantic announcements', () => {
  const snapshot = { running: true }
  const sourceListeners = new Set()
  const session = {
    getSnapshot: () => snapshot,
    subscribe: fn => { sourceListeners.add(fn); return () => sourceListeners.delete(fn) },
  }
  const current = {
    getSnapshot: () => ({ sessionId: 's1', hooks: { session } }),
    subscribe: () => () => {},
  }
  const store = createSignalStore(current, { setTimeout, clearTimeout })
  let announcements = 0
  const off = store.subscribe(() => { announcements += 1 })
  for (const listener of sourceListeners) listener()
  for (const listener of sourceListeners) listener()
  assert.equal(announcements, 0)
  assert.equal(store.getSnapshot().revision, 1)
  off()
  store.dispose()
})

test('session switches restore the new state and ignore stale old-session callbacks', () => {
  const currentListeners = new Set()
  const firstListeners = new Set()
  const secondListeners = new Set()
  let currentInfo
  const first = {
    getSnapshot: () => ({ running: true, runningCalls: [{}] }),
    subscribe: fn => { firstListeners.add(fn); return () => firstListeners.delete(fn) },
  }
  const second = {
    getSnapshot: () => ({ pendingInteraction: 'approval' }),
    subscribe: fn => { secondListeners.add(fn); return () => secondListeners.delete(fn) },
  }
  currentInfo = { sessionId: 'first', hooks: { session: first } }
  const current = {
    getSnapshot: () => currentInfo,
    subscribe: fn => { currentListeners.add(fn); return () => currentListeners.delete(fn) },
  }
  const store = createSignalStore(current, { setTimeout, clearTimeout })
  assert.equal(store.getSnapshot().state, 'tool-running')
  const staleCallback = [...firstListeners][0]

  currentInfo = { sessionId: 'second', hooks: { session: second } }
  for (const listener of currentListeners) listener()
  assert.equal(firstListeners.size, 0)
  assert.equal(store.getSnapshot().sessionId, 'second')
  assert.equal(store.getSnapshot().state, 'approval')

  staleCallback()
  assert.equal(store.getSnapshot().sessionId, 'second')
  assert.equal(store.getSnapshot().state, 'approval')

  currentInfo = undefined
  for (const listener of currentListeners) listener()
  assert.equal(secondListeners.size, 0)
  assert.equal(store.getSnapshot().state, 'idle')
  assert.equal(store.getSnapshot().source, 'no-session')
  store.dispose()
})

test('signal store disposal is idempotent', () => {
  let currentOffCalls = 0
  let sessionOffCalls = 0
  const session = {
    getSnapshot: () => ({ running: false }),
    subscribe: () => () => { sessionOffCalls += 1 },
  }
  const current = {
    getSnapshot: () => ({ sessionId: 's1', hooks: { session } }),
    subscribe: () => () => { currentOffCalls += 1 },
  }
  const store = createSignalStore(current, { setTimeout, clearTimeout })
  store.dispose()
  store.dispose()
  assert.equal(currentOffCalls, 1)
  assert.equal(sessionOffCalls, 1)
})
