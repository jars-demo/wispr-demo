// The Breakdown mark: a letter B taken apart like an engineering exploded view. The stem and top
// bowl stay put; the lower bowl, in orange, is pulled out of place. One source for every use:
// the nav logo, the favicon (src/app/icon.svg mirrors it), the iOS icon and the share card.

export const MARK_INK = '#141412'
export const MARK_PAPER = '#FBF8F1'
export const MARK_ORANGE = '#FF5A1F'

/** The mark as a standalone SVG string, for data URIs. `rounded` gives the tile its corners. */
export function markSvg({ rounded = true }: { rounded?: boolean } = {}): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    `<rect width="64" height="64"${rounded ? ' rx="16"' : ''} fill="${MARK_INK}"/>`,
    `<rect x="15" y="14" width="7" height="36" rx="1.5" fill="${MARK_PAPER}"/>`,
    `<path d="M25 14h10a8 8 0 0 1 0 16H25Z" fill="${MARK_PAPER}"/>`,
    `<path d="M29 34h12a8 8 0 0 1 0 16H29Z" fill="${MARK_ORANGE}"/>`,
    '</svg>',
  ].join('')
}

export function markDataUri(options?: { rounded?: boolean }): string {
  return `data:image/svg+xml;base64,${btoa(markSvg(options))}`
}
