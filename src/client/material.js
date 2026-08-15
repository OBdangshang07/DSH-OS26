import { relativeLuminance } from './contrast.js'

const PRESET_LUMINANCE = { aurora: 0.22, ocean: 0.14, dusk: 0.11, none: 0.5, custom: 0.28 }

export function effectiveOpacity(config, luminance = PRESET_LUMINANCE[config.wallpaper] ?? 0.28) {
  if (config.opaque || config.quality === 'eco') return 0.94
  const contrastFloor = luminance < 0.12 || luminance > 0.82 ? 0.72 : 0.65
  return Math.max(config.opacity / 100, contrastFloor)
}

export function materialTokens(config, luminance = PRESET_LUMINANCE[config.wallpaper] ?? 0.28) {
  const alpha = effectiveOpacity(config, luminance)
  return {
    '--dsw-alias-bg-base': {
      light: `rgba(238, 245, 255, ${Math.min(0.97, alpha + 0.08)})`,
      dark: `rgba(8, 15, 31, ${Math.min(0.97, alpha + 0.08)})`,
    },
    '--dsw-alias-bg-layer-1': {
      light: `rgba(255, 255, 255, ${alpha})`,
      dark: `rgba(19, 28, 48, ${alpha})`,
    },
    '--dsw-alias-bg-layer-2': {
      light: `rgba(248, 251, 255, ${Math.min(0.98, alpha + 0.07)})`,
      dark: `rgba(27, 38, 61, ${Math.min(0.98, alpha + 0.07)})`,
    },
    '--dsw-alias-bg-overlay': {
      light: `rgba(255, 255, 255, ${Math.min(0.98, alpha + 0.12)})`,
      dark: `rgba(12, 20, 38, ${Math.min(0.98, alpha + 0.12)})`,
    },
    '--dsw-alias-border-l1': { light: 'rgba(255,255,255,.76)', dark: 'rgba(255,255,255,.20)' },
    '--dsw-alias-border-l2': { light: 'rgba(62,78,112,.20)', dark: 'rgba(214,230,255,.28)' },
    '--dsw-alias-label-primary': { light: '#17213a', dark: '#f5f8ff' },
    '--dsw-alias-label-secondary': { light: '#485573', dark: '#b9c4db' },
    '--dsw-specific-sidebar-fill': {
      light: `rgba(231, 240, 255, ${Math.min(0.96, alpha + 0.03)})`,
      dark: `rgba(9, 18, 37, ${Math.min(0.96, alpha + 0.03)})`,
    },
  }
}

export function sampleWallpaperLuminance(dataUrl, environment = globalThis) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof environment.Image !== 'function' || !environment.document) {
      resolve(PRESET_LUMINANCE.custom)
      return
    }
    const image = new environment.Image()
    image.onload = () => {
      try {
        const canvas = environment.document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) throw new Error('canvas unavailable')
        context.drawImage(image, 0, 0, 32, 32)
        const pixels = context.getImageData(0, 0, 32, 32).data
        let total = 0
        for (let index = 0; index < pixels.length; index += 4) {
          total += relativeLuminance([pixels[index], pixels[index + 1], pixels[index + 2]])
        }
        resolve(Math.min(1, Math.max(0, total / (pixels.length / 4))))
      } catch {
        resolve(PRESET_LUMINANCE.custom)
      }
    }
    image.onerror = () => resolve(PRESET_LUMINANCE.custom)
    image.src = dataUrl
  })
}

function wallpaperValue(config) {
  if (config.wallpaper === 'none') return 'none'
  if (config.wallpaper === 'custom' && config.customWallpaper) return `url("${config.customWallpaper}")`
  if (config.wallpaper === 'ocean') return 'radial-gradient(circle at 12% 16%, #31c6d8 0, transparent 38%), radial-gradient(circle at 84% 76%, #3856c8 0, transparent 42%), #07152b'
  if (config.wallpaper === 'dusk') return 'radial-gradient(circle at 22% 18%, #ff9b85 0, transparent 34%), radial-gradient(circle at 76% 80%, #7567e8 0, transparent 44%), #1b1731'
  return 'radial-gradient(circle at 18% 12%, #6ee7f2 0, transparent 34%), radial-gradient(circle at 82% 22%, #9d80ff 0, transparent 38%), radial-gradient(circle at 62% 86%, #4b7cff 0, transparent 42%), #111d3c'
}

export function applyMaterialRoot(root, config, capabilities = {}) {
  root.dataset.dshOs26 = config.enabled ? 'on' : 'off'
  root.dataset.os26Quality = config.quality
  root.dataset.os26Scheme = config.scheme
  root.dataset.os26Motion = config.motion
  root.dataset.os26Opaque = config.opaque ? 'true' : 'false'
  root.dataset.os26Backdrop = capabilities.backdrop === false ? 'fallback' : 'supported'
  root.style.setProperty('--os26-opacity', String(effectiveOpacity(config)))
  root.style.setProperty('--os26-blur', `${config.blur}px`)
  root.style.setProperty('--os26-saturation', `${config.saturation}%`)
  root.style.setProperty('--os26-highlight', String(config.highlight / 100))
  root.style.setProperty('--os26-luminance', String(PRESET_LUMINANCE[config.wallpaper] ?? 0.28))
  root.style.setProperty('--os26-wallpaper', wallpaperValue(config))
}

export function clearMaterialRoot(root) {
  for (const key of ['dshOs26', 'os26Quality', 'os26Scheme', 'os26Motion', 'os26Opaque', 'os26Backdrop']) delete root.dataset[key]
  for (const name of ['--os26-opacity', '--os26-blur', '--os26-saturation', '--os26-highlight', '--os26-luminance', '--os26-wallpaper', '--os26-pointer-x', '--os26-pointer-y']) root.style.removeProperty(name)
}
