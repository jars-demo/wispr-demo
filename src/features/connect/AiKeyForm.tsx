'use client'

import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { AI_PROVIDER_INFO, AI_PROVIDERS, type AiProvider } from '@/domain/ai'
import { toast } from '@/features/fx/toasts'
import { useHydrated } from '@/lib/local-store'

import { aiKeyStore } from './connection'

// Bring your own AI key for bigger changes and no shared limits.

export function AiKeyForm() {
  const hydrated = useHydrated()
  const current = aiKeyStore.use()
  const [provider, setProvider] = useState<AiProvider>('groq')
  const [key, setKey] = useState('')
  const [model, setModel] = useState('')

  if (!hydrated) return <div className="h-24 animate-pulse rounded-card bg-surface-2/60" />

  if (current) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px]">
        <span className="rounded-full bg-ok-wash px-2.5 py-1 font-medium text-ok">
          ✓ Using your {AI_PROVIDER_INFO[current.provider].label} key
        </span>
        <span className="font-mono text-[13px] text-muted">{current.model}</span>
        <button
          type="button"
          onClick={() => aiKeyStore.write(null)}
          className="text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Remove key
        </button>
      </div>
    )
  }

  const info = AI_PROVIDER_INFO[provider]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const value = key.trim()
        if (value.length < 10) return
        aiKeyStore.write({ provider, key: value, model: model.trim() || info.defaultModel })
        setKey('')
        toast({ tone: 'info', icon: '🔑', title: `${info.label} key saved in this browser` })
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Provider">
        {AI_PROVIDERS.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={provider === p}
            onClick={() => {
              setProvider(p)
              setModel('')
            }}
            className={`rounded-full px-3 py-1.5 text-[13px] ring-1 ${provider === p ? 'bg-ink text-canvas ring-ink' : 'ring-hairline hover:bg-surface-2'}`}
          >
            {AI_PROVIDER_INFO[p].label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <label className="flex flex-col gap-1 text-[13px]">
          API key ·{' '}
          <a
            href={info.keyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent-text underline"
          >
            get one
          </a>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder={info.keyHint}
            className="h-11 rounded-full border border-hairline-strong bg-surface px-4 font-mono text-[14px]"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          Model
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={info.defaultModel}
            spellCheck={false}
            className="h-11 rounded-full border border-hairline-strong bg-surface px-4 font-mono text-[13px]"
          />
        </label>
      </div>
      <p className="text-[12px] text-muted">
        Kept in this browser. Each breakdown sends it to our server for that one call to{' '}
        {info.label}; it is never stored or logged. With your own key, breakdowns cover up to 3,000
        changed lines at once.
      </p>
      <div>
        <button
          type="submit"
          disabled={key.trim().length < 10}
          className={buttonStyles('primary', 'lg')}
        >
          Use my key
        </button>
      </div>
    </form>
  )
}
