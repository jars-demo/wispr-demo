'use client'

import { LIMITS } from '@/domain/spec'
import { useSpeech } from '@/features/voice/useSpeech'
import { VoiceOrb } from '@/features/voice/VoiceOrb'

// The "say it" step, voice first: tap the orb and talk. The box below shows the words and can be
// typed into or dictated into with Wispr Flow or any system dictation.

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

  const status = speech.listening
    ? 'Listening. Tap again when you are done.'
    : speech.supported
      ? 'Tap and talk, or type below. Wispr Flow works too.'
      : 'Hold your Wispr Flow key and talk, or type below.'

  return (
    <div className="glass flex flex-col gap-4 rounded-panel p-4 sm:p-6">
      {speech.supported ? (
        <div className="flex items-center gap-4">
          <VoiceOrb
            size="md"
            listening={speech.listening}
            onToggle={speech.listening ? speech.stop : speech.start}
            disabled={disabled}
          />
          <p aria-live="polite" className="text-[15px] text-ink-2">
            {status}
          </p>
        </div>
      ) : (
        <p className="text-[15px] text-ink-2">{status}</p>
      )}

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
        rows={5}
        placeholder="What should it do? What should it leave alone? What are you unsure about?"
        className="min-h-36 w-full resize-y rounded-card bg-surface/70 p-4 text-[17px] leading-relaxed outline-none placeholder:text-muted/80 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
      />

      {speech.error ? (
        <p role="alert" className="rounded-xl bg-warn-wash px-3 py-2 text-sm text-warn">
          {speech.error}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
        <span>{speech.supported ? 'Speech uses your browser’s speech service.' : ''}</span>
        <span className="font-mono">
          {value.length.toLocaleString()} / {LIMITS.transcript.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
