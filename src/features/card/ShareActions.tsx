'use client'

import { Download, Link2 } from 'lucide-react'

import { buttonStyles } from '@/components/ui/button-styles'
import { shareText, type CardData } from '@/domain/card'
import { levelFor } from '@/domain/game'
import { toast } from '@/features/fx/toasts'

import { cardUrl, xShareUrl } from './share'

// Post the card on X (the main action), copy its link or download the image. The link always
// points at wispr.jishanahmed.in, and X unfurls it into the card image.

/** The X logo, drawn inline: Lucide carries no brand marks. */
function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z" />
    </svg>
  )
}

export function ShareActions({ card, size = 'lg' }: { card: CardData; size?: 'field' | 'lg' }) {
  const url = cardUrl(card)
  const text = shareText(card, levelFor(card.xp).title)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      toast({ tone: 'info', title: 'Card link copied' })
    } catch {
      toast({ tone: 'error', title: 'Copy failed', body: 'Your browser blocked the clipboard.' })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={xShareUrl(text, url)}
        target="_blank"
        rel="noreferrer"
        className={buttonStyles('primary', size)}
      >
        <XMark className="size-4" />
        Post on X
      </a>
      <button
        type="button"
        onClick={() => void copyLink()}
        className={buttonStyles('secondary', size)}
      >
        <Link2 aria-hidden="true" className="size-4" />
        Copy link
      </button>
      <a
        href={`${new URL(url).pathname}/opengraph-image`}
        download="breakdown-card.png"
        className={buttonStyles('ghost', size)}
      >
        <Download aria-hidden="true" className="size-4" />
        Image
      </a>
    </div>
  )
}
