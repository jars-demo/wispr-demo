import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { TOKEN_PAIRS, type Theme } from '@/app/design/tokens'
import { contrastRatio } from '@/lib/contrast'

const css = readFileSync(new URL('../../src/app/globals.css', import.meta.url), 'utf8')

// Light tokens live in the first :root block, dark tokens in the data-theme="dark" block.
const darkStart = css.search(/:root\[data-theme=['"]dark['"]\]/)
if (darkStart < 0) throw new Error('Dark theme block not found in globals.css')
const blocks: Record<Theme, string> = {
  light: css.slice(0, darkStart),
  dark: css.slice(darkStart, css.indexOf('@theme inline')),
}

function tokenValue(theme: Theme, token: string): string | undefined {
  const match = new RegExp(`${token}:\\s*(#[0-9a-f]{6});`, 'i').exec(blocks[theme])
  return match?.[1]?.toLowerCase()
}

describe.each(['light', 'dark'] as const)('%s design tokens', (theme) => {
  it.each(TOKEN_PAIRS[theme].map((pair) => [pair.name, pair] as const))(
    '%s mirrors globals.css and meets WCAG AA for normal text',
    (_name, pair) => {
      expect(tokenValue(theme, pair.fgToken)).toBe(pair.foreground)
      expect(tokenValue(theme, pair.bgToken)).toBe(pair.background)
      expect(contrastRatio(pair.foreground, pair.background)).toBeGreaterThanOrEqual(4.5)
    },
  )
})
