'use client'

import { LIMITS } from '@/domain/spec'

import { useSpeech } from './useSpeech'

// The "say it" step: one big box you can type or dictate into, plus an optional mic.

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DictationBox({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
}) {
  const speech = useSpeech((text) => {
    if (text) onChange(value.trim() ? `${value.trimEnd()} ${text}` : text)
  })

  return (
    <div className="glass flex flex-col gap-3 rounded-panel p-4 sm:p-5">
      <label htmlFor="transcript" className="sr-only">
        What do you want your agent to do?
      </label>
      <textarea
        id="transcript"
        value={speech.interim ? `${value}${value ? ' ' : ''}${speech.interim}` : value}
        onChange={(event) => onChange(event.target.value)}
        readOnly={speech.listening}
        disabled={disabled}
        maxLength={LIMITS.transcript}
        rows={7}
        placeholder="Talk through the change like you would to a teammate. What should it do? What should it not touch? What are you unsure about?"
        className="min-h-44 w-full resize-y bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-muted/80 disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {speech.supported ? (
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              disabled={disabled}
              aria-pressed={speech.listening}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-40 ${
                speech.listening
                  ? 'bg-accent text-accent-on'
                  : 'bg-surface-2 text-ink hover:bg-surface'
              }`}
            >
              {speech.listening ? (
                <span
                  className="size-2 animate-pulse rounded-full bg-accent-on"
                  aria-hidden="true"
                />
              ) : (
                <MicIcon />
              )}
              {speech.listening ? 'Stop' : 'Speak'}
            </button>
          ) : null}
          <span className="text-[13px] text-muted" aria-live="polite">
            {speech.listening
              ? 'Listening…'
              : speech.supported
                ? 'Or use Wispr Flow or any dictation app in the box.'
                : 'Use Wispr Flow or any dictation app, or type.'}
          </span>
        </div>
        <span className="font-mono text-[12px] text-muted">
          {value.length.toLocaleString()} / {LIMITS.transcript.toLocaleString()}
        </span>
      </div>
      {speech.error ? (
        <p role="alert" className="rounded-xl bg-warn-wash px-3 py-2 text-sm text-warn">
          {speech.error}
        </p>
      ) : null}
      {speech.supported ? (
        <p className="text-[12px] text-muted">
          The Speak button uses your browser&rsquo;s speech service, which may send audio to the
          browser maker.
        </p>
      ) : null}
    </div>
  )
}
