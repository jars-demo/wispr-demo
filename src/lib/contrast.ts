// WCAG 2.x relative luminance and contrast ratio for opaque sRGB hex colours.
// Used by the design preview to show measured ratios instead of claimed ones.

const HEX_COLOUR = /^#([0-9a-f]{6})$/i

function channelToLinear(channel: number): number {
  const srgb = channel / 255
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const match = HEX_COLOUR.exec(hex)
  if (!match?.[1]) throw new RangeError(`Expected a #rrggbb colour, got "${hex}"`)
  const value = Number.parseInt(match[1], 16)
  const r = channelToLinear((value >> 16) & 0xff)
  const g = channelToLinear((value >> 8) & 0xff)
  const b = channelToLinear(value & 0xff)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const [lighter, darker] = a > b ? [a, b] : [b, a]
  return (lighter + 0.05) / (darker + 0.05)
}

export type ContrastGrade = 'AAA' | 'AA' | 'AA large' | 'Fail'

/** Grade for normal-size text; "AA large" means usable only at 24px, or 18.66px bold, and up. */
export function gradeContrast(ratio: number): ContrastGrade {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA large'
  return 'Fail'
}
