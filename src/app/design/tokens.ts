// Hex values mirrored from globals.css for the measured contrast table on /design.
// tests/unit/design-tokens.test.ts fails if these drift from the stylesheet.

export type Theme = 'light' | 'dark'

export type TokenPair = {
  name: string
  foreground: string
  background: string
  fgToken: string
  bgToken: string
  use: string
}

export const TOKEN_PAIRS: Record<Theme, TokenPair[]> = {
  light: [
    {
      name: 'Body text',
      fgToken: '--ink',
      bgToken: '--canvas',
      foreground: '#141412',
      background: '#fbf8f1',
      use: 'All primary text',
    },
    {
      name: 'Secondary text',
      fgToken: '--muted',
      bgToken: '--canvas',
      foreground: '#6b675f',
      background: '#fbf8f1',
      use: 'Descriptions, metadata',
    },
    {
      name: 'Primary button',
      fgToken: '--canvas',
      bgToken: '--ink',
      foreground: '#fbf8f1',
      background: '#141412',
      use: 'Main call to action',
    },
    {
      name: 'Accent button',
      fgToken: '--accent-on',
      bgToken: '--accent',
      foreground: '#141412',
      background: '#ff5a1f',
      use: 'Orange fill, black text',
    },
    {
      name: 'Orange text',
      fgToken: '--accent-text',
      bgToken: '--surface',
      foreground: '#c2410c',
      background: '#ffffff',
      use: 'Requirement codes, emphasis',
    },
    {
      name: 'Evidence found',
      fgToken: '--ok',
      bgToken: '--ok-wash',
      foreground: '#15803d',
      background: '#ecfdf3',
      use: 'Verdict badge',
    },
    {
      name: 'Partial',
      fgToken: '--warn',
      bgToken: '--warn-wash',
      foreground: '#b45309',
      background: '#fffbeb',
      use: 'Verdict badge',
    },
    {
      name: 'Not found',
      fgToken: '--bad',
      bgToken: '--bad-wash',
      foreground: '#b91c1c',
      background: '#fef2f2',
      use: 'Verdict badge',
    },
    {
      name: 'Violates non-goal',
      fgToken: '--breach',
      bgToken: '--breach-wash',
      foreground: '#9a3412',
      background: '#fff7ed',
      use: 'Verdict badge',
    },
    {
      name: 'Unverifiable',
      fgToken: '--unknown',
      bgToken: '--unknown-wash',
      foreground: '#52525b',
      background: '#f4f4f5',
      use: 'Verdict badge',
    },
  ],
  dark: [
    {
      name: 'Body text',
      fgToken: '--ink',
      bgToken: '--canvas',
      foreground: '#f5f5f4',
      background: '#0a0a0a',
      use: 'All primary text',
    },
    {
      name: 'Secondary text',
      fgToken: '--muted',
      bgToken: '--surface',
      foreground: '#a1a1a1',
      background: '#141414',
      use: 'Descriptions, metadata',
    },
    {
      name: 'Accent button',
      fgToken: '--accent-on',
      bgToken: '--accent',
      foreground: '#0a0a0a',
      background: '#ff6a33',
      use: 'Orange fill, black text',
    },
    {
      name: 'Orange text',
      fgToken: '--accent-text',
      bgToken: '--surface',
      foreground: '#ff8a5c',
      background: '#141414',
      use: 'Requirement codes, emphasis',
    },
    {
      name: 'Evidence found',
      fgToken: '--ok',
      bgToken: '--ok-wash',
      foreground: '#4ade80',
      background: '#0f1f14',
      use: 'Verdict badge',
    },
    {
      name: 'Partial',
      fgToken: '--warn',
      bgToken: '--warn-wash',
      foreground: '#fbbf24',
      background: '#1f1a0a',
      use: 'Verdict badge',
    },
    {
      name: 'Not found',
      fgToken: '--bad',
      bgToken: '--bad-wash',
      foreground: '#f87171',
      background: '#220f0f',
      use: 'Verdict badge',
    },
    {
      name: 'Violates non-goal',
      fgToken: '--breach',
      bgToken: '--breach-wash',
      foreground: '#fb923c',
      background: '#221408',
      use: 'Verdict badge',
    },
    {
      name: 'Unverifiable',
      fgToken: '--unknown',
      bgToken: '--unknown-wash',
      foreground: '#a1a1aa',
      background: '#1c1c1f',
      use: 'Verdict badge',
    },
  ],
}
