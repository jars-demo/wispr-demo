'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { LIMITS } from '@/domain/spec'
import { PENDING_TRANSCRIPT_KEY } from '@/features/spec/draft'
import { useSpeech } from '@/features/voice/useSpeech'
import { VoiceOrb } from '@/features/voice/VoiceOrb'

// The landing page's single action. Wispr Flow is the voice: click the box, hold the Flow key and
// talk, and Flow types the words here. The small mic is a backup for people without Flow.
// The words are handed to /new, which organises them straight away.

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-hairline-strong bg-surface px-1.5 font-sans text-[12px] font-medium text-ink shadow-[0_1px_0_var(--hairline-strong)]">
      {children}
    </kbd>
  )
}

export function VoiceStart() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const speech = useSpeech((chunk) => {
    if (chunk) setText((current) => (current.trim() ? `${current.trimEnd()} ${chunk}` : chunk))
  })

  function toggleMic() {
    if (speech.listening) return speech.stop()
    if (!speech.supported) {
      setHint('This browser has no mic support. Click the box and use Wispr Flow, or type.')
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
  const notice = speech.listening
    ? 'Listening with your browser mic. Tap it to stop.'
    : (speech.error ?? hint)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="glass-strong flex w-full max-w-2xl flex-col gap-3 rounded-[2rem] p-3 text-left shadow-lift sm:p-4"
    >
      <div className="flex flex-wrap items-center gap-2 px-2 pt-1 text-[13px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="key-pulse size-2 rounded-full bg-accent" aria-hidden="true" />
          Talk with Wispr Flow: click below, hold
        </span>
        <span className="inline-flex items-center gap-1">
          <Key>Fn</Key>
          <span className="text-muted">on Mac</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Key>Ctrl</Key>
          <span className="text-muted">+</span>
          <Key>Win</Key>
          <span className="text-muted">on Windows</span>
        </span>
      </div>

      <label htmlFor="start-text" className="sr-only">
        What do you want your agent to build?
      </label>
      <textarea
        id="start-text"
        ref={field}
        value={shown}
        readOnly={speech.listening}
        maxLength={LIMITS.transcript}
        rows={3}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        placeholder="Say what you want built. What should it do? What should it leave alone? What are you unsure about?"
        className="min-h-28 w-full resize-none rounded-[1.4rem] bg-surface/80 px-4 py-3.5 text-[17px] leading-relaxed outline-none [field-sizing:content] placeholder:text-muted/80 focus-visible:outline-2 focus-visible:outline-accent sm:text-[18px]"
      />

      {notice ? (
        <p
          aria-live="polite"
          className={`px-2 text-[13px] ${speech.listening ? 'text-ink-2' : 'text-warn'}`}
        >
          {notice}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 pl-1">
          <VoiceOrb
            size="sm"
            listening={speech.listening}
            onToggle={toggleMic}
            label={
              speech.listening ? 'Stop the browser mic' : 'No Wispr Flow? Use your browser mic'
            }
          />
          <span className="hidden text-[12px] text-muted sm:inline">No Flow? Use the mic</span>
        </div>
        <button type="submit" disabled={!text.trim()} className={buttonStyles('primary', 'lg')}>
          Make my checklist
        </button>
      </div>
    </form>
  )
}
