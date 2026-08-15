import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [manifest, changelog, ci, candidate, publish] = await Promise.all([
  read('package.json').then(JSON.parse),
  read('CHANGELOG.md'),
  read('.github/workflows/ci.yml'),
  read('.github/workflows/release-candidate.yml'),
  read('.github/workflows/publish-npm.yml'),
])

test('release identity agrees across manifest, changelog and gated workflow', () => {
  assert.equal(manifest.version, '0.1.0-beta.1')
  assert.match(changelog, /\[0\.1\.0-beta\.1\] - 2026-08-16/)
  assert.match(publish, /ref: v0\.1\.0-beta\.1/)
  assert.match(publish, /PUBLISH dsh-os26@0\.1\.0-beta\.1/)
})

test('CI covers both supported development runners', () => {
  assert.match(ci, /ubuntu-latest/)
  assert.match(ci, /windows-latest/)
  assert.match(ci, /npm run quality/)
  assert.match(ci, /npm run release:audit/)
})

test('candidate workflow cannot publish and publish workflow requires explicit protected dispatch', () => {
  assert.doesNotMatch(candidate, /npm publish/)
  assert.match(candidate, /workflow_dispatch/)
  assert.match(publish, /workflow_dispatch/)
  assert.doesNotMatch(publish, /\bpush:/)
  assert.match(publish, /environment: npm-release/)
  assert.match(publish, /id-token: write/)
  assert.match(publish, /npm publish --tag beta --provenance --access public/)
  assert.match(publish, /secrets\.NPM_TOKEN/)
})
