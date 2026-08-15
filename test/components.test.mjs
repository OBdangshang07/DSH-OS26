import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ComposerDock, StatusOverlay } from '../src/client/components.js'
import { DEFAULT_CONFIG } from '../src/client/config.js'

function fixedStore(value) {
  return { getSnapshot: () => value, subscribe: () => () => {} }
}

const configStore = fixedStore(DEFAULT_CONFIG)
const cases = {
  idle: '准备接收下一条任务',
  thinking: 'Agent 正在组织下一步',
  'tool-running': '真实工具调用正在执行',
  approval: '请在原生审批区确认操作',
  success: '由真实运行结束事件触发',
  error: '请查看会话中的错误详情',
  blocked: '回答问题或审阅计划后继续',
}

for (const [state, expected] of Object.entries(cases)) {
  test(`renders accessible ${state} state semantics`, () => {
    const signalStore = fixedStore({ state, source: 'fixture', toolCount: state === 'tool-running' ? 2 : 0 })
    const overlay = renderToStaticMarkup(createElement(StatusOverlay, { signalStore, configStore }))
    const composer = renderToStaticMarkup(createElement(ComposerDock, { signalStore, configStore }))
    assert.match(overlay, /role="status"/)
    assert.match(overlay, /aria-live="polite"/)
    assert.match(overlay, new RegExp(expected))
    assert.match(composer, new RegExp(`data-state="${state}"`))
    if (state === 'tool-running') assert.match(overlay, /2 个工具/)
    if (state === 'approval') assert.match(overlay, /本插件不会代替你的决定/)
    if (state === 'success') assert.match(overlay, /完成回执/)
  })
}

test('Cinematic mode includes deterministic SVG optics', () => {
  const signalStore = fixedStore({ state: 'idle', source: 'fixture', toolCount: 0 })
  const cinematicConfig = fixedStore({ ...DEFAULT_CONFIG, quality: 'cinematic' })
  const markup = renderToStaticMarkup(createElement(StatusOverlay, { signalStore, configStore: cinematicConfig }))
  assert.match(markup, /id="os26-fluid-optic"/)
  assert.match(markup, /<feTurbulence/)
  assert.match(markup, /seed="26"/)
})

test('master-disabled components render no surface', () => {
  const signalStore = fixedStore({ state: 'thinking', source: 'fixture', toolCount: 0 })
  const disabledConfig = fixedStore({ ...DEFAULT_CONFIG, enabled: false })
  assert.equal(renderToStaticMarkup(createElement(StatusOverlay, { signalStore, configStore: disabledConfig })), '')
  assert.equal(renderToStaticMarkup(createElement(ComposerDock, { signalStore, configStore: disabledConfig })), '')
})
