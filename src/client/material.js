import { relativeLuminance } from './contrast.js'

const PRESET_LUMINANCE = { aurora: 0.22, ocean: 0.14, dusk: 0.11, none: 0.5, custom: 0.28 }

export function effectiveOpacity(config, luminance = PRESET_LUMINANCE[config.wallpaper] ?? 0.28) {
  if (config.opaque || config.quality === 'eco') return 0.94
  const contrastFloor = luminance < 0.12 || luminance > 0.82 ? 0.72 : 0.65
  return Math.max(config.opacity / 100, contrastFloor)
}

export function materialTokens(config, luminance = PRESET_LUMINANCE[config.wallpaper] ?? 0.28) {
  const alpha = effectiveOpacity(config, luminance)
  const themed = (light, dark) => {
    if (config.scheme === 'light') return { light, dark: light }
    if (config.scheme === 'dark') return { light: dark, dark }
    return { light, dark }
  }
  return {
    '--dsw-alias-bg-base': themed(
      `rgba(242, 244, 248, ${Math.min(0.98, alpha + 0.16)})`,
      `rgba(11, 13, 18, ${Math.min(0.98, alpha + 0.16)})`,
    ),
    '--dsw-alias-bg-layer-1': themed(
      `rgba(255, 255, 255, ${alpha})`,
      `rgba(24, 26, 32, ${alpha})`,
    ),
    '--dsw-alias-bg-layer-2': themed(
      `rgba(250, 251, 253, ${Math.min(0.98, alpha + 0.07)})`,
      `rgba(34, 36, 43, ${Math.min(0.98, alpha + 0.07)})`,
    ),
    '--dsw-alias-bg-overlay': themed(
      `rgba(248, 249, 252, ${Math.min(0.98, alpha + 0.12)})`,
      `rgba(17, 19, 24, ${Math.min(0.98, alpha + 0.12)})`,
    ),
    '--dsw-alias-border-l1': themed('rgba(255,255,255,.82)', 'rgba(255,255,255,.16)'),
    '--dsw-alias-border-l2': themed('rgba(53,57,68,.22)', 'rgba(229,232,241,.24)'),
    '--dsw-alias-label-primary': themed('#181a20', '#f4f5f8'),
    '--dsw-alias-label-secondary': themed('#5e626d', '#b8bbc5'),
    '--dsw-specific-sidebar-fill': themed(
      `rgba(236, 239, 244, ${Math.min(0.96, alpha + 0.03)})`,
      `rgba(16, 18, 23, ${Math.min(0.96, alpha + 0.03)})`,
    ),
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
  root.dataset.os26Wallpaper = config.wallpaper
  root.dataset.os26Backdrop = capabilities.backdrop === false ? 'fallback' : 'supported'
  root.style.setProperty('--os26-opacity', String(effectiveOpacity(config)))
  root.style.setProperty('--os26-blur', `${config.blur}px`)
  root.style.setProperty('--os26-saturation', `${config.saturation}%`)
  root.style.setProperty('--os26-highlight', String(config.highlight / 100))
  root.style.setProperty('--os26-luminance', String(PRESET_LUMINANCE[config.wallpaper] ?? 0.28))
  root.style.setProperty('--os26-wallpaper', wallpaperValue(config))
}

export function clearMaterialRoot(root) {
  for (const key of ['dshOs26', 'os26Quality', 'os26Scheme', 'os26Motion', 'os26Opaque', 'os26Wallpaper', 'os26Backdrop']) delete root.dataset[key]
  for (const name of ['--os26-opacity', '--os26-blur', '--os26-saturation', '--os26-highlight', '--os26-luminance', '--os26-wallpaper', '--os26-pointer-x', '--os26-pointer-y']) root.style.removeProperty(name)
}
