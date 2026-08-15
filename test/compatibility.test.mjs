import assert from 'node:assert/strict'
import test from 'node:test'
import { themeCompatibility } from '../src/client/index.js'

test('known or active third-party themes receive a concrete conflict warning', () => {
  const warning = themeCompatibility({
    active: { id: 'dsh-theme-lab' },
    themes: [{ id: 'light' }, { id: 'dark' }, { id: 'dsh-theme-lab' }],
  })
  assert.match(warning, /dsh-theme-lab/)
  assert.match(warning, /只保留一套/)
})

test('built-in themes still explain the official API detection limit', () => {
  const warning = themeCompatibility({
    active: { id: 'dark' },
    themes: [{ id: 'light' }, { id: 'dark' }],
  })
  assert.match(warning, /无法识别仅覆盖 Token/)
  assert.match(warning, /请勿同时启用两套/)
})
