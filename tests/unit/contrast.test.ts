import { describe, expect, it } from 'vitest'

import { contrastRatio, gradeContrast, relativeLuminance } from '@/lib/contrast'

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10)
  })

  it('rejects shorthand, named and malformed colours', () => {
    expect(() => relativeLuminance('#fff')).toThrow(RangeError)
    expect(() => relativeLuminance('white')).toThrow(RangeError)
    expect(() => relativeLuminance('#gggggg')).toThrow(RangeError)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white and symmetric in its arguments', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5)
  })

  it('is 1 for identical colours', () => {
    expect(contrastRatio('#ff5a1f', '#ff5a1f')).toBe(1)
  })

  it('matches the published WCAG boundary example of #767676 on white (about 4.54)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })
})

describe('gradeContrast', () => {
  it.each([
    [7, 'AAA'],
    [4.5, 'AA'],
    [4.49, 'AA large'],
    [3, 'AA large'],
    [2.99, 'Fail'],
  ] as const)('grades %d as %s', (ratio, grade) => {
    expect(gradeContrast(ratio)).toBe(grade)
  })
})
