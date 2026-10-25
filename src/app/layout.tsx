import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'

import { Toaster } from '@/features/fx/Toaster'
import { SITE_URL } from '@/domain/card'

import './globals.css'
import './fx.css'
import './ui.css'

// next/font downloads these at build time and serves them from our own origin.
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Breakdown · SHIPPED IT? Now understand it.', template: '%s · Breakdown' },
  description:
    'Your coding agent ships the code. Breakdown turns every change into a short game, so you understand exactly what it did and the engineering behind it.',
  twitter: { card: 'summary_large_image', creator: '@jishanarshaikh' },
}

export const viewport: Viewport = {
  themeColor: '#fbf8f1',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only rounded-full bg-ink px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
