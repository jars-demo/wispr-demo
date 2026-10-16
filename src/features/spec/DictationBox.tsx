'use client'

import { LIMITS } from '@/domain/spec'
import { WisprHint } from '@/features/home/WisprHint'

// The "say it" step. Wispr Flow types into this box while the Flow key is held; typing works too.

export function DictationBox({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  disabled: boolean
}) {
  return (
    <div className="glow-box glass flex flex-col gap-3 rounded-panel p-3 sm:p-4">
      <WisprHint />
      <label htmlFor="transcript" className="sr-only">
        What do you want your agent to do?
      </label>
      <textarea
        id="transcript"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        maxLength={LIMITS.transcript}
        rows={5}
        placeholder="What should it do? What should it leave alone? What are you unsure about?"
        className="min-h-36 w-full resize-y rounded-card bg-surface/80 p-4 text-[17px] leading-relaxed outline-none placeholder:text-muted/80 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60"
      />
      <div className="flex justify-end px-1 font-mono text-[12px] text-muted">
        {value.length.toLocaleString()} / {LIMITS.transcript.toLocaleString()}
      </div>
    </div>
  )
}
