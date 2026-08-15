export function linearChannel(value) {
  const channel = Math.min(255, Math.max(0, value)) / 255
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance([red, green, blue]) {
  return linearChannel(red) * 0.2126 + linearChannel(green) * 0.7152 + linearChannel(blue) * 0.0722
}

export function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
}

export function compositeRgb(foreground, background, alpha) {
  return foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha))
}
