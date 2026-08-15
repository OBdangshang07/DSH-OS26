import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_CONFIG, createConfigStore, normalizeConfig } from '../src/client/config.js'
import { compositeRgb, contrastRatio } from '../src/client/contrast.js'
import { applyMaterialRoot, clearMaterialRoot, effectiveOpacity, materialTokens } from '../src/client/material.js'

test('invalid or old settings migrate to safe bounded defaults', () => {
  const value = normalizeConfig({ quality: 'warp-speed', opacity: 999, blur: -5, customWallpaper: 'https://example.test/x' })
  assert.equal(value.quality, DEFAULT_CONFIG.quality)
  assert.equal(value.opacity, 96)
  assert.equal(value.blur, 0)
  assert.equal(value.customWallpaper, '')
})

test('config writes normalized local-only values and resets', () => {
  const memory = new Map()
  const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
  const store = createConfigStore(storage)
  store.update({ quality: 'eco', saturation: 1 })
  assert.equal(store.getSnapshot().quality, 'eco')
  assert.equal(store.getSnapshot().saturation, 80)
  assert.equal(memory.size, 1)
  store.reset()
  assert.deepEqual(store.getSnapshot(), { ...DEFAULT_CONFIG })
})

test('every official theme override has both light and dark values', () => {
  const tokens = materialTokens(DEFAULT_CONFIG)
  assert.ok(Object.keys(tokens).length >= 8)
  for (const value of Object.values(tokens)) {
    assert.equal(typeof value.light, 'string')
    assert.equal(typeof value.dark, 'string')
  }
})

test('dark wallpapers raise the readable material fill floor', () => {
  const requested = { ...DEFAULT_CONFIG, opacity: 20, opaque: false, quality: 'balanced' }
  const dark = materialTokens(requested, 0.08)['--dsw-alias-bg-layer-1'].dark
  const light = materialTokens(requested, 0.7)['--dsw-alias-bg-layer-1'].dark
  assert.match(dark, /0\.72/)
  assert.match(light, /0\.65/)
})

test('normal text stays WCAG AA over adversarial black and white backdrops', () => {
  const config = { ...DEFAULT_CONFIG, opacity: 65, quality: 'balanced', opaque: false }
  const lightText = [23, 33, 58]
  const lightSurface = [255, 255, 255]
  const darkText = [245, 248, 255]
  const darkSurface = [19, 28, 48]
  for (const wallpaperLuminance of [0, 0.11, 0.5, 0.9, 1]) {
    const alpha = effectiveOpacity(config, wallpaperLuminance)
    const lightBackground = compositeRgb(lightSurface, [0, 0, 0], alpha)
    const darkBackground = compositeRgb(darkSurface, [255, 255, 255], alpha)
    assert.ok(contrastRatio(lightText, lightBackground) >= 4.5)
    assert.ok(contrastRatio(darkText, darkBackground) >= 4.5)
  }
})

test('unsupported backdrop capability falls back and lifecycle cleanup removes all root state', () => {
  const properties = new Map()
  const root = {
    dataset: {},
    style: {
      setProperty: (name, value) => properties.set(name, value),
      removeProperty: name => properties.delete(name),
    },
  }
  applyMaterialRoot(root, DEFAULT_CONFIG, { backdrop: false })
  assert.equal(root.dataset.os26Backdrop, 'fallback')
  assert.equal(root.dataset.dshOs26, 'on')
  assert.ok(properties.size > 0)
  clearMaterialRoot(root)
  assert.deepEqual(root.dataset, {})
  assert.equal(properties.size, 0)
})
