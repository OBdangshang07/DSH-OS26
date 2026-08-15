import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeLineEndings } from '../scripts/text-normalization.mjs'

test('generated bundle freshness checks ignore platform line endings', () => {
  const generated = 'window.__ModuleLoader__.load({\n  id: \'dsh-os26\',\n});\n'
  const windowsCheckout = generated.replaceAll('\n', '\r\n')

  assert.equal(normalizeLineEndings(windowsCheckout), normalizeLineEndings(generated))
  assert.notEqual(normalizeLineEndings(`${windowsCheckout}// stale\r\n`), normalizeLineEndings(generated))
})
