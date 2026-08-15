import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import * as React from 'react'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
const client = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')

test('declares a DSH Web bundle and client face', () => {
  assert.equal(packageJson.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(packageJson.dsh.client.platform, 'web')
  assert.equal(packageJson.exports['./client'], './lib/client.js')
  assert.deepEqual(packageJson.dsh.client.inject, [
    '@deepseek-ai/dsh-client-runtime',
    '@deepseek-ai/dsh-client-ui-theme',
    '@deepseek-ai/dsh-client-ui-layout',
    '@deepseek-ai/dsh-client-ui-settings',
    '@deepseek-ai/dsh-client-ui-conversation',
  ])
})

test('mounts one stable Cordis row', () => {
  assert.match(patch, /id:\s*dsh-os26/)
  assert.match(patch, /name:\s*dsh-os26/)
})

test('emits a DSH module-loader bundle', () => {
  assert.match(client, /window\.__ModuleLoader__\.load/)
  assert.match(client, /id:\s*['"]dsh-os26['"]/)
  assert.match(client, /Agent-reactive material/)
  assert.match(client, /conversation\.composer\.dock/)
  assert.match(client, /settings\.section/)
  assert.doesNotMatch(client, /querySelector/)
})

test('registers a client module with an apply function', () => {
  let registration
  const context = vm.createContext({
    window: {
      __ModuleLoader__: {
        load(value) {
          registration = value
        },
      },
    },
  })

  new vm.Script(client, { filename: 'lib/client.js' }).runInContext(context)
  assert.equal(registration.id, 'dsh-os26')

  const required = []
  const clientModule = registration.factory((id) => {
    required.push(id)
    if (id === 'react') return React
    throw new Error(`Unexpected platform module: ${id}`)
  })
  assert.equal(clientModule.name, 'dsh-os26')
  assert.equal(typeof clientModule.apply, 'function')
  assert.deepEqual(required, ['react'])
  assert.deepEqual([...clientModule.inject], ['slots', 'theme', 'sessions'])
})
