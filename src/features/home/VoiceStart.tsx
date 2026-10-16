'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { LIMITS } from '@/domain/spec'
import { PENDING_TRANSCRIPT_KEY } from '@/features/spec/draft'
import { useSpeech } from '@/features/voice/useSpeech'
import { VoiceOrb } from '@/features/voice/VoiceOrb'

import { WordOrbit } from './WordOrbit'

// The landing page's single action: tap the orb and talk, or type (Wispr Flow types here too).
// The words are handed to /new, which organises them straight away.

export function VoiceStart() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const speech = useSpeech((chunk) => {
    if (chunk) setText((current) => (current.trim() ? `${current.trimEnd()} ${chunk}` : chunk))
  })

  function toggle() {
    if (speech.listening) return speech.stop()
    if (!speech.supported) {
      setHint('This browser cannot listen. Click the box and talk with Wispr Flow, or type.')
      field.current?.focus()
      return
    }
    setHint(null)
    speech.start()
  }

  function submit() {
    const value = text.trim()
    if (!value) {
      field.current?.focus()
      return
    }
    speech.stop()
    try {
      window.sessionStorage.setItem(PENDING_TRANSCRIPT_KEY, value)
    } catch {
      // Without storage the words cannot travel; /new still opens and the user can paste.
    }
    router.push('/new')
  }

  const shown = speech.interim ? `${text}${text ? ' ' : ''}${speech.interim}` : text
  const status = speech.listening
    ? 'Listening. Tap again when you are done.'
    : (speech.error ?? hint ?? 'Tap and tell Receipts what you want built.')

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4">
      <div className="relative -my-2 flex size-60 items-center justify-center sm:size-72">
        <WordOrbit />
        <VoiceOrb listening={speech.listening} onToggle={toggle} />
      </div>
      <p
        aria-live="polite"
        className={`min-h-6 text-center text-[15px] ${speech.error || hint ? 'text-warn' : 'text-muted'}`}
      >
        {status}
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="glass-strong flex w-full items-end gap-2 rounded-[1.75rem] p-2 pl-5"
      >
        <label htmlFor="start-text" className="sr-only">
          What do you want your agent to build?
        </label>
        <textarea
          id="start-text"
          ref={field}
          value={shown}
          readOnly={speech.listening}
          maxLength={LIMITS.transcript}
          rows={1}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          placeholder="Click here and talk with Wispr Flow, or type"
          className="max-h-48 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-relaxed outline-none [field-sizing:content] placeholder:text-muted/80"
        />
        <button
          type="submit"
          aria-label="Make my checklist"
          disabled={!text.trim()}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-opacity hover:opacity-90 disabled:opacity-25"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <p className="text-center text-[12px] text-muted">
        Wispr Flow: click the box, hold Fn (Mac) or Ctrl + Win (Windows) and talk. Free, no sign-up.
      </p>
    </div>
  )
}
