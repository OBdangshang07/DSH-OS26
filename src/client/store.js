export function createStore(initialValue) {
  let value = initialValue
  const listeners = new Set()

  return {
    getSnapshot: () => value,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set(next) {
      if (Object.is(value, next)) return
      value = next
      for (const listener of [...listeners]) listener()
    },
  }
}
