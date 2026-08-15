import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SettingsPanel } from '../src/client/components.js'
import { DEFAULT_CONFIG } from '../src/client/config.js'
import { materialTokens } from '../src/client/material.js'
import { OS26_STYLES } from '../src/client/styles.js'

function fixedStore(value) {
  return {
    getSnapshot: () => value,
    subscribe: () => () => {},
    update: () => {},
    reset: () => {},
  }
}

test('V2 palette uses neutral shell surfaces instead of a blue page wash', () => {
  const tokens = materialTokens(DEFAULT_CONFIG)
  assert.match(tokens['--dsw-alias-bg-base'].light, /rgba\(242, 244, 248/)
  assert.match(tokens['--dsw-specific-sidebar-fill'].light, /rgba\(236, 239, 244/)
  assert.doesNotMatch(tokens['--dsw-alias-bg-base'].light, /238, 245, 255/)
  assert.match(OS26_STYLES, /body \{\s*background: var\(--os26-wallpaper\) !important/)
})

test('forced light and dark schemes lock both host token branches', () => {
  const light = materialTokens({ ...DEFAULT_CONFIG, scheme: 'light' })
  const dark = materialTokens({ ...DEFAULT_CONFIG, scheme: 'dark' })
  const system = materialTokens({ ...DEFAULT_CONFIG, scheme: 'system' })
  for (const name of ['--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-label-primary', '--dsw-specific-sidebar-fill']) {
    assert.equal(light[name].light, light[name].dark)
    assert.equal(dark[name].light, dark[name].dark)
    assert.notEqual(system[name].light, system[name].dark)
  }
  assert.match(dark['--dsw-alias-bg-base'].light, /rgba\(11, 13, 18/)
  assert.equal(dark['--dsw-alias-label-primary'].light, '#f4f5f8')
})

test('native composer enhancements use semantic DSH hooks, never generated classes', () => {
  for (const hook of ['data-composer-card', 'data-input-scroll', 'data-input-backdrop', 'data-input-mirror']) {
    assert.match(OS26_STYLES, new RegExp(`\\[${hook}\\]`))
  }
  assert.doesNotMatch(OS26_STYLES, /_[A-Za-z0-9]{5,}|module_css/)
  assert.match(OS26_STYLES, /\[data-composer-card\]:focus-within/)
  assert.match(OS26_STYLES, /textarea::placeholder/)
  assert.match(OS26_STYLES, /\[data-os26-primary\]/)
  assert.match(OS26_STYLES, /button:not\(\[aria-haspopup\]\):has/)
  assert.match(OS26_STYLES, /\[data-composer-card\]::before/)
  assert.match(OS26_STYLES, /\[data-composer-seat\] \{[\s\S]*?position: sticky;[\s\S]*?bottom: 0;/)
  assert.match(OS26_STYLES, /\[data-composer-seat\]::before \{\s*display: none !important;/)
  assert.match(OS26_STYLES, /url\('#os26-composer-refraction'\)/)
  assert.match(OS26_STYLES, /backdrop-filter: blur\(calc\(var\(--os26-blur\) \* \.54\)\)/)
})

test('settings render custom glass controls with progress-aware sliders', () => {
  const markup = renderToStaticMarkup(createElement(SettingsPanel, {
    configStore: fixedStore(DEFAULT_CONFIG),
    diagnostics: () => ({}),
    compatibility: '',
  }))
  assert.match(markup, /class="os26-toggle"/)
  assert.match(markup, /class="os26-select-shell"/)
  assert.match(markup, /--os26-range-progress:/)
  assert.match(OS26_STYLES, /::-webkit-slider-thumb/)
  assert.match(OS26_STYLES, /::-moz-range-progress/)
})

test('V2 includes overflow and narrow-layout safeguards', () => {
  assert.match(OS26_STYLES, /min-width: 0/)
  assert.match(OS26_STYLES, /text-overflow: ellipsis/)
  assert.match(OS26_STYLES, /overflow-wrap: anywhere/)
  assert.match(OS26_STYLES, /@media \(max-width: 560px\)/)
  assert.match(OS26_STYLES, /\[role='dialog'\]:has\(\.os26-settings\)/)
  assert.match(OS26_STYLES, /width: min\(960px, calc\(100vw - 24px\)\) !important/)
  assert.match(OS26_STYLES, /\[data-slot='sidebar\.settings'\] \[role='presentation'\]:has\(\.os26-settings\)/)
  assert.match(OS26_STYLES, /\[data-slot='sidebar\.settings'\] \[role='presentation'\] \{[\s\S]*?--os26-modal-scrim/)
  assert.match(OS26_STYLES, /\[data-slot='sidebar\.settings'\] \[role='dialog'\] \{[\s\S]*?background: var\(--os26-modal-fill\) !important/)
  assert.match(OS26_STYLES, /:has\(\[data-slot='sidebar\.settings'\] \[role='presentation'\] \[role='dialog'\]\) \[data-composer-seat\]/)
  assert.match(OS26_STYLES, /data-os26-quality='eco'[\s\S]*?\[data-slot='sidebar\.settings'\] \[role='dialog'\]/)
})

test('plugin-provided agent presets stay inside a compact scrollable menu', () => {
  assert.match(OS26_STYLES, /body > \[role='menu'\]:has\(\[role='menuitem'\]/)
  assert.match(OS26_STYLES, /max-height: min\(520px, calc\(100vh - 24px\)\)/)
  assert.match(OS26_STYLES, /overscroll-behavior: contain/)
  assert.match(OS26_STYLES, /-webkit-line-clamp: 2/)
})

test('sidebar glass and session focus use stable slot and tree semantics', () => {
  assert.match(OS26_STYLES, /\[data-slot='sidebar'\] > \*/)
  assert.match(OS26_STYLES, /\[data-slot='sidebar\.settings'\] > button/)
  assert.match(OS26_STYLES, /\[role='treeitem'\]\[aria-selected='true'\]/)
  assert.match(OS26_STYLES, /\[role='treeitem'\]\[aria-selected\] \{[\s\S]*?border-radius: 15px/)
  assert.match(OS26_STYLES, /\[role='treeitem'\]:focus-visible/)
  assert.doesNotMatch(OS26_STYLES, /aria-label=['"][^'"]*[\u3400-\u9fff]/u)
  assert.doesNotMatch(OS26_STYLES, /:nth-(?:child|of-type)/)
})

test('refractive optics extend to appropriate controls without wrapping reading surfaces', () => {
  for (const selector of ['.os26-status-capsule::before', '.os26-settings-hero::before', '.os26-select-shell select',
    '.os26-activity-surface::before', '.os26-settings fieldset::before']) {
    assert.match(OS26_STYLES, new RegExp(selector.replaceAll('.', '\\.')))
  }
  assert.match(OS26_STYLES, /\[role='dialog'\]:has\(\.os26-settings\)::before/)
  assert.match(OS26_STYLES, /body > \[role='menu'\]:has\([\s\S]*?::before/)
  assert.match(OS26_STYLES, /\[data-slot='sidebar\.settings'\] > button[\s\S]*?backdrop-filter/)
  assert.match(OS26_STYLES, /\[role='treeitem'\]\[aria-selected='true'\][\s\S]*?backdrop-filter/)
  assert.doesNotMatch(OS26_STYLES, /\[data-conversation-scroll\][^{]*\{[^}]*url\('#os26-composer-refraction'\)/)
  assert.doesNotMatch(OS26_STYLES, /\[data-composer-seat\]::before[\s\S]*?background: var\(--os26-wallpaper\)/)
})

test('sidebar blur lives on a pseudo layer so fixed settings are not clipped', () => {
  const rootRule = OS26_STYLES.match(/\[data-slot='sidebar'\] > \* \{([\s\S]*?)\n\}/)?.[1] ?? ''
  const lensRule = OS26_STYLES.match(/\[data-slot='sidebar'\] > \*::before \{([\s\S]*?)\n\}/)?.[1] ?? ''
  assert.doesNotMatch(rootRule, /backdrop-filter/)
  assert.match(lensRule, /backdrop-filter/)
  assert.match(lensRule, /inset: 0/)
})

test('real DSH runtime surfaces use official semantic boundaries', () => {
  for (const hook of [
    'data-tool',
    'data-variant',
    'data-goal-bar',
    'data-approval-key',
    'data-question-key',
    'data-plan-review-key',
    'data-chat-flow-kind',
  ]) {
    assert.match(OS26_STYLES, new RegExp(`\\[${hook}`))
  }
  assert.match(OS26_STYLES, /\[data-tool\]\[data-variant\]\[data-state='running'\]/)
  assert.match(OS26_STYLES, /\[data-tool\]\[data-variant\]\[data-state='error'\]/)
  assert.match(OS26_STYLES, /\[data-question-key\] \[aria-checked='true'\]/)
  assert.doesNotMatch(OS26_STYLES, /_[A-Za-z0-9]{5,}|module_css/)
})
