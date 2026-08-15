import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_CONFIG, createConfigStore, normalizeConfig } from '../src/client/config.js'
import { materialTokens } from '../src/client/material.js'

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
  assert.match(dark, /0\.68/)
  assert.match(light, /0\.48/)
})
