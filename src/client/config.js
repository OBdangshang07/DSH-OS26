import { createStore } from './store.js'

export const STORAGE_KEY = 'dsh-os26.config.v1'
export const MAX_WALLPAPER_BYTES = 2 * 1024 * 1024

export const DEFAULT_CONFIG = Object.freeze({
  version: 1,
  enabled: true,
  scheme: 'system',
  quality: 'balanced',
  opacity: 58,
  blur: 24,
  saturation: 150,
  highlight: 64,
  motion: 'system',
  opaque: false,
  wallpaper: 'aurora',
  customWallpaper: '',
  diagnostics: false,
})

const ENUMS = {
  scheme: ['system', 'light', 'dark'],
  quality: ['eco', 'balanced', 'cinematic'],
  motion: ['system', 'full', 'reduced'],
  wallpaper: ['aurora', 'ocean', 'dusk', 'none', 'custom'],
}

function numberIn(value, fallback, min, max) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback
}

export function normalizeConfig(input) {
  const source = input && typeof input === 'object' ? input : {}
  const next = { ...DEFAULT_CONFIG }
  next.enabled = typeof source.enabled === 'boolean' ? source.enabled : next.enabled
  next.opaque = typeof source.opaque === 'boolean' ? source.opaque : next.opaque
  next.diagnostics = typeof source.diagnostics === 'boolean' ? source.diagnostics : next.diagnostics
  for (const [key, values] of Object.entries(ENUMS)) {
    if (values.includes(source[key])) next[key] = source[key]
  }
  next.opacity = numberIn(source.opacity, next.opacity, 20, 96)
  next.blur = numberIn(source.blur, next.blur, 0, 48)
  next.saturation = numberIn(source.saturation, next.saturation, 80, 220)
  next.highlight = numberIn(source.highlight, next.highlight, 0, 100)
  if (typeof source.customWallpaper === 'string'
      && source.customWallpaper.length <= MAX_WALLPAPER_BYTES * 1.45
      && /^data:image\/(?:png|jpeg|webp);base64,/.test(source.customWallpaper)) {
    next.customWallpaper = source.customWallpaper
  }
  if (next.wallpaper === 'custom' && !next.customWallpaper) next.wallpaper = 'aurora'
  return next
}

export function createConfigStore(storage = globalThis.localStorage) {
  let initial = DEFAULT_CONFIG
  try { initial = normalizeConfig(JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')) } catch {}
  const store = createStore(initial)

  return {
    ...store,
    update(patch) {
      const next = normalizeConfig({ ...store.getSnapshot(), ...patch })
      store.set(next)
      try { storage?.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
    },
    reset() {
      const next = { ...DEFAULT_CONFIG }
      store.set(next)
      try { storage?.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
    },
  }
}
