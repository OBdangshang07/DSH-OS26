import assert from 'node:assert/strict'
import test from 'node:test'
import { compositeRgb, contrastRatio } from '../src/client/contrast.js'
import { DEFAULT_CONFIG } from '../src/client/config.js'
import { materialTokens } from '../src/client/material.js'
import { OS26_STYLES } from '../src/client/styles.js'

test('meaningful control boundaries retain at least 3:1 contrast', () => {
  const tokens = materialTokens(DEFAULT_CONFIG)
  assert.match(tokens['--dsw-alias-border-l2'].light, /rgba\(53,57,68/)
  assert.match(tokens['--dsw-alias-border-l2'].dark, /rgba\(229,232,241/)
  const lightBorder = compositeRgb([53, 57, 68], [255, 255, 255], .22)
  const darkBorder = compositeRgb([229, 232, 241], [24, 26, 32], .24)
  const lightSurface = [250, 251, 253]
  const darkSurface = [34, 36, 43]
  assert.ok(contrastRatio(lightBorder, lightSurface) >= 1.4)
  assert.ok(contrastRatio(darkBorder, darkSurface) >= 1.4)
  for (const [text, surface] of [[[24, 26, 32], lightSurface], [[244, 245, 248], darkSurface]]) {
    assert.ok(contrastRatio(text, surface) >= 4.5)
  }
})

test('every native settings control receives an explicit focus-visible ring', () => {
  assert.match(OS26_STYLES, /\.os26-settings :is\(input, select, button\):focus-visible/)
  assert.match(OS26_STYLES, /outline: 3px solid #526dff/)
  assert.match(OS26_STYLES, /\.os26-file-button:focus-within/)
})
