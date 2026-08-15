import * as React from 'react'
import { MAX_WALLPAPER_BYTES } from './config.js'

const h = React.createElement

const STATE_COPY = {
  idle: ['待命', '准备接收下一条任务'],
  thinking: ['思考中', 'Agent 正在组织下一步'],
  'tool-running': ['工具运行中', '真实工具调用正在执行'],
  approval: ['等待审批', '请在原生审批区确认操作'],
  success: ['已完成', '本轮任务已安全结束'],
  error: ['发生错误', '请查看会话中的错误详情'],
  blocked: ['需要你处理', '回答问题或审阅计划后继续'],
}

function useStore(store) {
  return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}

function StateMark({ state }) {
  return h('span', { className: 'os26-state-mark', 'aria-hidden': 'true' })
}

export function StatusOverlay({ signalStore, configStore }) {
  const signal = useStore(signalStore)
  const config = useStore(configStore)
  if (!config.enabled) return null
  const copy = STATE_COPY[signal.state] ?? STATE_COPY.idle
  const expanded = ['tool-running', 'approval', 'blocked', 'error'].includes(signal.state)

  return h('div', { className: 'os26-overlay-stack', 'data-state': signal.state },
    config.quality === 'cinematic' && h('svg', { className: 'os26-filter-defs', 'aria-hidden': 'true' },
      h('filter', { id: 'os26-fluid-optic', x: '-30%', y: '-30%', width: '160%', height: '160%' },
        h('feTurbulence', { type: 'fractalNoise', baseFrequency: '.018 .032', numOctaves: '2', seed: '26', result: 'noise' }),
        h('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: '5', xChannelSelector: 'R', yChannelSelector: 'B' }))),
    h('section', {
      className: `os26-status-capsule${expanded ? ' is-expanded' : ''}`,
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'aria-label': `DSH-OS26：${copy[0]}。${copy[1]}`,
    },
    h(StateMark, { state: signal.state }),
    h('span', { className: 'os26-status-copy' },
      h('strong', null, copy[0]),
      h('small', null, copy[1])),
    signal.state === 'tool-running' && h('span', { className: 'os26-tool-count' }, `${signal.toolCount} 个工具`)),
    signal.state === 'tool-running' && h('section', { className: 'os26-activity-surface', 'aria-label': '工具活动' },
      h('div', { className: 'os26-activity-track', 'aria-hidden': 'true' }, h('i')),
      h('span', null, 'Harness 正在执行真实调用')),
    (signal.state === 'approval' || signal.state === 'blocked') && h('aside', {
      className: 'os26-attention-surface',
      role: 'note',
    }, h('strong', null, signal.state === 'approval' ? '操作权已交还给你' : 'Agent 正在等你'),
    h('span', null, signal.state === 'approval' ? '使用原生审批控件继续；本插件不会代替你的决定。' : '在原生输入区完成问题或计划审阅。')),
    signal.state === 'success' && h('output', { className: 'os26-receipt-surface' },
      h('span', { className: 'os26-check', 'aria-hidden': 'true' }, '✓'),
      h('span', null, h('strong', null, '完成回执'), h('small', null, '由真实运行结束事件触发'))))
}

export function ComposerDock({ signalStore, configStore }) {
  const signal = useStore(signalStore)
  const config = useStore(configStore)
  if (!config.enabled) return null
  const copy = STATE_COPY[signal.state] ?? STATE_COPY.idle
  return h('div', { className: 'os26-composer-dock', 'data-state': signal.state },
    h(StateMark, { state: signal.state }),
    h('span', null, copy[0]),
    h('span', { className: 'os26-composer-detail' }, signal.state === 'idle' ? 'Agent-reactive material' : copy[1]))
}

function Toggle({ checked, onChange, label, hint }) {
  return h('label', { className: 'os26-setting-row' },
    h('span', null, h('strong', null, label), hint && h('small', null, hint)),
    h('input', { type: 'checkbox', checked, onChange: e => onChange(e.currentTarget.checked) }))
}

function Select({ value, onChange, label, children }) {
  return h('label', { className: 'os26-setting-row' }, h('strong', null, label),
    h('select', { value, onChange: e => onChange(e.currentTarget.value) }, children))
}

function Range({ value, onChange, label, min, max, unit = '' }) {
  return h('label', { className: 'os26-range-row' },
    h('span', null, h('strong', null, label), h('output', null, `${value}${unit}`)),
    h('input', { type: 'range', min, max, value, onChange: e => onChange(Number(e.currentTarget.value)) }))
}

const option = (value, label) => h('option', { value, key: value }, label)

export function SettingsPanel({ configStore, diagnostics, compatibility }) {
  const config = useStore(configStore)
  const [notice, setNotice] = React.useState('')
  const patch = key => value => configStore.update({ [key]: value })

  const importWallpaper = event => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > MAX_WALLPAPER_BYTES) {
      setNotice('仅支持不超过 2 MB 的 PNG、JPEG 或 WebP。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      configStore.update({ customWallpaper: reader.result, wallpaper: 'custom' })
      setNotice('壁纸只保存在本浏览器。')
    }
    reader.onerror = () => setNotice('无法读取这张图片。')
    reader.readAsDataURL(file)
  }

  const exportDiagnostics = () => {
    const blob = new Blob([JSON.stringify(diagnostics(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'dsh-os26-diagnostics.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('诊断文件不含提示词、会话内容、路径或凭据。')
  }

  return h('section', { className: 'os26-settings', 'aria-labelledby': 'os26-settings-title' },
    h('header', { className: 'os26-settings-hero' },
      h('span', { className: 'os26-settings-orb', 'aria-hidden': 'true' }),
      h('span', null, h('h2', { id: 'os26-settings-title' }, 'DSH-OS26'), h('p', null, '真实 Agent 状态驱动的 Liquid Glass 材质系统'))),
    compatibility && h('p', { className: 'os26-warning', role: 'status' }, compatibility),
    h('fieldset', null, h('legend', null, '启用与外观'),
      h(Toggle, { checked: config.enabled, onChange: patch('enabled'), label: '启用 DSH-OS26', hint: '关闭后立即撤销主题 Token 和全部界面' }),
      h(Select, { value: config.scheme, onChange: patch('scheme'), label: '浮层配色' }, option('system', '跟随系统'), option('light', '浅色'), option('dark', '深色')),
      h(Select, { value: config.quality, onChange: patch('quality'), label: '质量档位' }, option('eco', 'Eco · 静态省电'), option('balanced', 'Balanced · 推荐'), option('cinematic', 'Cinematic · 增强高光')),
      h(Select, { value: config.wallpaper, onChange: patch('wallpaper'), label: '壁纸' }, option('aurora', 'Aurora'), option('ocean', 'Ocean'), option('dusk', 'Dusk'), option('none', '无'), config.customWallpaper && option('custom', '本地自定义')),
      h('label', { className: 'os26-file-button' }, '导入本地壁纸', h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', onChange: importWallpaper }))),
    h('fieldset', null, h('legend', null, '材质参数'),
      h(Range, { value: config.opacity, onChange: patch('opacity'), label: '填充不透明度', min: 20, max: 96, unit: '%' }),
      h(Range, { value: config.blur, onChange: patch('blur'), label: '模糊', min: 0, max: 48, unit: 'px' }),
      h(Range, { value: config.saturation, onChange: patch('saturation'), label: '饱和度', min: 80, max: 220, unit: '%' }),
      h(Range, { value: config.highlight, onChange: patch('highlight'), label: '高光', min: 0, max: 100, unit: '%' })),
    h('fieldset', null, h('legend', null, '辅助功能与隐私'),
      h(Select, { value: config.motion, onChange: patch('motion'), label: '动态效果' }, option('system', '跟随系统'), option('full', '完整'), option('reduced', '减少动态')),
      h(Toggle, { checked: config.opaque, onChange: patch('opaque'), label: '不透明模式', hint: '弱化透明与背景模糊，增强可读性' }),
      h(Toggle, { checked: config.diagnostics, onChange: patch('diagnostics'), label: '开发诊断', hint: '只显示状态来源，不记录会话内容' })),
    h('div', { className: 'os26-settings-actions' },
      h('button', { type: 'button', onClick: exportDiagnostics }, '导出隐私安全诊断'),
      h('button', { type: 'button', className: 'secondary', onClick: () => { configStore.reset(); setNotice('已恢复默认设置。') } }, '恢复默认')),
    notice && h('p', { className: 'os26-notice', role: 'status' }, notice),
    h('p', { className: 'os26-disclaimer' }, '独立社区项目，与 DeepSeek 或 Apple 无隶属或背书关系。'))
}

export function DiagnosticBadge({ signalStore, configStore }) {
  const signal = useStore(signalStore)
  const config = useStore(configStore)
  if (!config.enabled || !config.diagnostics) return null
  return h('code', { className: 'os26-diagnostics' }, `${signal.state} ← ${signal.source}`)
}
