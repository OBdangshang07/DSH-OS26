import assert from 'node:assert/strict'
import test from 'node:test'
import { installOverflowTitles } from '../src/client/index.js'

function element({ text = '完整文本', width = 80, scrollWidth = 160, title } = {}) {
  const attributes = new Map(title ? [['title', title]] : [])
  return {
    textContent: text,
    clientWidth: width,
    scrollWidth,
    clientHeight: 20,
    scrollHeight: 20,
    isConnected: true,
    hasAttribute: name => attributes.has(name),
    getAttribute: name => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, String(value)),
    removeAttribute: name => attributes.delete(name),
    attributes,
  }
}

function rootOf(candidates) {
  return {
    querySelectorAll: () => [{ querySelectorAll: () => candidates }],
  }
}

test('clipped semantic text gets a removable native full-copy affordance', () => {
  const clipped = element({ text: '超长目标内容' })
  const dispose = installOverflowTitles(rootOf([clipped]), () => true, {
    getComputedStyle: () => ({ textOverflow: 'ellipsis', webkitLineClamp: 'none' }),
  })
  assert.equal(clipped.getAttribute('title'), '超长目标内容')
  assert.equal(clipped.getAttribute('data-os26-overflow-title'), 'true')
  dispose()
  assert.equal(clipped.getAttribute('title'), null)
  assert.equal(clipped.getAttribute('data-os26-overflow-title'), null)
})

test('existing product titles and unclipped text are never overwritten', () => {
  const existing = element({ title: '宿主标题' })
  const unclipped = element({ width: 160, scrollWidth: 160 })
  const dispose = installOverflowTitles(rootOf([existing, unclipped]), () => true, {
    getComputedStyle: () => ({ textOverflow: 'ellipsis', webkitLineClamp: 'none' }),
  })
  assert.equal(existing.getAttribute('title'), '宿主标题')
  assert.equal(unclipped.getAttribute('title'), null)
  dispose()
  assert.equal(existing.getAttribute('title'), '宿主标题')
})
