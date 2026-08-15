import assert from 'node:assert/strict'
import test from 'node:test'
import { compositeRgb, contrastRatio } from '../src/client/contrast.js'
import { OS26_STYLES } from '../src/client/styles.js'

test('meaningful control boundaries retain at least 3:1 contrast', () => {
  const lightBorder = [59, 73, 100]
  const darkBorder = [225, 233, 247]
  for (const alpha of [0.65, 0.72, 0.94]) {
    for (const wallpaper of [[0, 0, 0], [255, 255, 255]]) {
      const surfaceAlpha = Math.min(0.98, alpha + 0.07)
      const lightSurface = compositeRgb([248, 251, 255], wallpaper, surfaceAlpha)
      const darkSurface = compositeRgb([27, 38, 61], wallpaper, surfaceAlpha)
      assert.ok(contrastRatio(lightBorder, lightSurface) >= 3)
      assert.ok(contrastRatio(darkBorder, darkSurface) >= 3)
    }
  }
})

test('every native settings control receives an explicit focus-visible ring', () => {
  assert.match(OS26_STYLES, /\.os26-settings :is\(input, select, button\):focus-visible/)
  assert.match(OS26_STYLES, /outline: 3px solid #526dff/)
  assert.match(OS26_STYLES, /\.os26-file-button:focus-within/)
})
