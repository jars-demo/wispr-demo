import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

// next/font downloads these at build time and serves them from our own origin.
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Receipts', template: '%s · Receipts' },
  description:
    'Speak a spec, hand it to your coding agent, then audit the pull request against it with evidence.',
}

export const viewport: Viewport = {
  themeColor: '#fafaf9',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only rounded-full bg-ink px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
