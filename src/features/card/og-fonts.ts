import 'server-only'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Fonts for next/og share images: Geist and Instrument Serif, both OFL with their licences in
// src/app/card/fonts. Read from the repo so images render without fetching anything.

const file = (name: string) => readFile(join(process.cwd(), 'src/app/card/fonts', name))

export async function loadOgFonts() {
  const [sans, sansSemi, sansBold, serif, serifItalic] = await Promise.all([
    file('Geist-Regular.ttf'),
    file('Geist-SemiBold.ttf'),
    file('Geist-Bold.ttf'),
    file('InstrumentSerif-Regular.ttf'),
    file('InstrumentSerif-Italic.ttf'),
  ])
  return [
    { name: 'Geist', data: sans, style: 'normal', weight: 400 },
    { name: 'Geist', data: sansSemi, style: 'normal', weight: 600 },
    { name: 'Geist', data: sansBold, style: 'normal', weight: 700 },
    { name: 'Instrument Serif', data: serif, style: 'normal', weight: 400 },
    { name: 'Instrument Serif', data: serifItalic, style: 'italic', weight: 400 },
  ] as const
}
