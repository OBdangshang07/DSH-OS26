import { createStore } from './store.js'

export const INITIAL_SIGNAL = Object.freeze({
  state: 'idle',
  source: 'no-session',
  sessionId: undefined,
  toolCount: 0,
  revision: 0,
})

function pendingKinds(snapshot) {
  const pending = snapshot?.pending
  if (!Array.isArray(pending)) return []
  return pending.map(item => item?.kind ?? item?.type).filter(Boolean)
}

export function deriveSemanticState(snapshot) {
  if (!snapshot) return { state: 'idle', source: 'no-session', toolCount: 0 }
  const kinds = pendingKinds(snapshot)
  const summaryKind = snapshot.pendingInteraction
  if (summaryKind === 'approval' || kinds.includes('approval')) {
    return { state: 'approval', source: 'pending-approval', toolCount: snapshot.runningCalls?.length ?? 0 }
  }
  if (summaryKind === 'question' || summaryKind === 'plan-review'
      || kinds.includes('question') || kinds.includes('plan-review')) {
    return { state: 'blocked', source: `pending-${summaryKind ?? kinds[0]}`, toolCount: snapshot.runningCalls?.length ?? 0 }
  }
  if ((snapshot.runningCalls?.length ?? 0) > 0) {
    return { state: 'tool-running', source: 'running-calls', toolCount: snapshot.runningCalls.length }
  }
  if (snapshot.running === true) return { state: 'thinking', source: 'session-running', toolCount: 0 }
  if (snapshot.lastAgentError || snapshot.promptError) return { state: 'error', source: 'session-error', toolCount: 0 }
  return { state: 'idle', source: 'session-idle', toolCount: 0 }
}

export function createSignalStore(currentProvideInfo, timers = globalThis) {
  const store = createStore(INITIAL_SIGNAL)
  let sessionOff
  let successTimer
  let lastWasActive = false
  let revision = 0

  const clearSuccess = () => {
    if (successTimer !== undefined) timers.clearTimeout(successTimer)
    successTimer = undefined
  }

  const publish = (sessionId, snapshot) => {
    const next = deriveSemanticState(snapshot)
    const active = ['thinking', 'tool-running', 'approval', 'blocked'].includes(next.state)
    const completed = !active && lastWasActive && next.state === 'idle'
    lastWasActive = active
    clearSuccess()
    const signal = { ...next, sessionId, revision: ++revision }
    if (completed) {
      store.set({ ...signal, state: 'success', source: 'run-settled' })
      successTimer = timers.setTimeout(() => store.set({
        ...signal,
        state: 'idle',
        source: 'success-expired',
        revision: ++revision,
      }), 4200)
    } else {
      store.set(signal)
    }
  }

  const bindCurrent = () => {
    sessionOff?.()
    sessionOff = undefined
    clearSuccess()
    lastWasActive = false
    const info = currentProvideInfo?.getSnapshot?.()
    const source = info?.hooks?.session
    if (!source?.getSnapshot) {
      publish(undefined, undefined)
      return
    }
    const sync = () => publish(info.sessionId, source.getSnapshot())
    sessionOff = source.subscribe?.(sync)
    sync()
  }

  const currentOff = currentProvideInfo?.subscribe?.(bindCurrent)
  bindCurrent()
  return {
    ...store,
    dispose() {
      currentOff?.()
      sessionOff?.()
      clearSuccess()
    },
  }
}
