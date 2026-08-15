import { ComposerDock, DiagnosticBadge, SettingsPanel, StatusOverlay } from './components.js'
import { createConfigStore } from './config.js'
import { applyMaterialRoot, clearMaterialRoot, effectiveOpacity, materialTokens, sampleWallpaperLuminance } from './material.js'
import { createSignalStore } from './state.js'
import { OS26_STYLES } from './styles.js'

export const name = 'dsh-os26'
export const inject = ['slots', 'theme', 'sessions']

const KNOWN_FULL_SHELL_THEMES = ['dsh-liquid-glass', 'dsh-theme-lab', 'dsh-skin-glass', 'silk-background']

export function themeCompatibility(snapshot) {
  const ids = [snapshot?.active?.id, ...(snapshot?.themes ?? []).map(theme => theme?.id)]
    .filter(id => typeof id === 'string')
  const detected = ids.find(id => !['light', 'dark', 'system'].includes(id)
    || KNOWN_FULL_SHELL_THEMES.some(name => id.includes(name)))
  if (detected) {
    return `检测到另一套主题“${detected}”。建议只保留一套全局主题 Token，避免透明度和文字颜色叠加。`
  }
  return '兼容提示：DSH 官方主题 API 无法识别仅覆盖 Token、但不注册主题名称的插件；请勿同时启用两套全局玻璃主题。'
}

function capabilities() {
  const css = globalThis.CSS
  return {
    backdrop: Boolean(css?.supports?.('backdrop-filter', 'blur(1px)') || css?.supports?.('-webkit-backdrop-filter', 'blur(1px)')),
    reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    reducedTransparency: globalThis.matchMedia?.('(prefers-reduced-transparency: reduce)').matches ?? false,
  }
}

export function apply(ctx) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const configStore = createConfigStore()
  const signalStore = createSignalStore(ctx.sessions?.currentProvideInfo)
  const caps = capabilities()
  const style = document.createElement('style')
  style.dataset.dshOs26 = 'styles'
  style.textContent = OS26_STYLES

  ctx.effect(() => {
    document.head.append(style)
    return () => style.remove()
  }, 'dsh-os26: scoped styles')

  ctx.effect(() => {
    let tokenOff
    let generation = 0
    const sync = () => {
      const currentGeneration = ++generation
      const config = configStore.getSnapshot()
      tokenOff?.()
      tokenOff = undefined
      if (!config.enabled) {
        clearMaterialRoot(root)
        root.dataset.dshOs26 = 'off'
        return
      }
      applyMaterialRoot(root, config, caps)
      tokenOff = ctx.theme.overrideTokens(name, materialTokens(config))
      if (config.wallpaper === 'custom' && config.customWallpaper) {
        void sampleWallpaperLuminance(config.customWallpaper).then((luminance) => {
          if (currentGeneration !== generation) return
          root.style.setProperty('--os26-luminance', String(luminance))
          root.style.setProperty('--os26-opacity', String(effectiveOpacity(config, luminance)))
          tokenOff?.()
          tokenOff = ctx.theme.overrideTokens(name, materialTokens(config, luminance))
        })
      }
    }
    sync()
    const off = configStore.subscribe(sync)
    return () => {
      off()
      tokenOff?.()
      clearMaterialRoot(root)
    }
  }, 'dsh-os26: material controller')

  ctx.effect(() => {
    let frame
    const onMove = event => {
      const config = configStore.getSnapshot()
      if (frame || !config.enabled || config.quality === 'eco') return
      frame = requestAnimationFrame(() => {
        frame = undefined
        if (!configStore.getSnapshot().enabled) return
        root.style.setProperty('--os26-pointer-x', `${event.clientX}px`)
        root.style.setProperty('--os26-pointer-y', `${event.clientY}px`)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, 'dsh-os26: bounded pointer optics')

  ctx.effect(() => () => signalStore.dispose(), 'dsh-os26: signal store')

  const diagnostics = () => ({
    plugin: name,
    version: '0.1.0-beta.1',
    testedDsh: '@deepseek-ai/dsh@0.1.0-rc.6',
    state: signalStore.getSnapshot().state,
    source: signalStore.getSnapshot().source,
    quality: configStore.getSnapshot().quality,
    capabilities: caps,
  })
  const compatibility = themeCompatibility(ctx.theme.getTheme?.())

  ctx.slots.inject('shell.overlay', () => [
    ctx.slots.register({ name: 'shell.overlay', id: 'dsh-os26-status', order: 2600, inject: () => ({ signalStore, configStore }) }, StatusOverlay),
    ctx.slots.register({ name: 'shell.overlay', id: 'dsh-os26-diagnostics', order: 2601, inject: () => ({ signalStore, configStore }) }, DiagnosticBadge),
  ])
  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
    name: 'conversation.composer.dock', id: 'dsh-os26-composer', order: 2600,
    inject: () => ({ signalStore, configStore }),
  }, ComposerDock))
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: 'dsh-os26', order: 260,
    label: 'DSH-OS26', inject: () => ({ configStore, diagnostics, compatibility }),
  }, SettingsPanel))
}
