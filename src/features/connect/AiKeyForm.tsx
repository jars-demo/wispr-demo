'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { AI_PROVIDER_INFO, AI_PROVIDERS, type AiProvider } from '@/domain/ai'
import { toast } from '@/features/fx/toasts'
import { useHydrated } from '@/lib/local-store'

import { aiKeyStore } from './connection'

// Bring your own AI key for unlimited breakdowns and bigger changes. The key stays in this
// browser and rides along with each breakdown request; the server never stores or logs it.

export function AiKeyForm() {
  const hydrated = useHydrated()
  const current = aiKeyStore.use()
  const [provider, setProvider] = useState<AiProvider>('groq')
  const [key, setKey] = useState('')
  const [model, setModel] = useState('')

  if (!hydrated) return <div className="h-32 animate-pulse rounded-card bg-surface-2/60" />

  if (current) {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-[15px]">
          <span className="grid size-6 place-items-center rounded-full bg-ok-wash text-ok">
            <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
          </span>
          Using your{' '}
          <span className="font-semibold">{AI_PROVIDER_INFO[current.provider].label}</span> key
        </p>
        <p className="font-mono text-[13px] text-muted">{current.model}</p>
        <div>
          <button
            type="button"
            onClick={() => aiKeyStore.write(null)}
            className={buttonStyles('secondary', 'field')}
          >
            Remove key
          </button>
        </div>
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
        toast({ tone: 'info', title: `${info.label} key saved in this browser` })
      }}
      className="flex flex-col gap-3"
    >
      <div
        role="radiogroup"
        aria-label="Provider"
        className="grid grid-cols-2 gap-1 rounded-[1.25rem] bg-surface-2 p-1 sm:grid-cols-4 sm:rounded-full"
      >
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
            className={`h-9 rounded-full text-[13.5px] font-medium transition ${provider === p ? 'bg-surface text-ink shadow-[var(--shadow-soft)] ring-1 ring-hairline' : 'text-muted hover:text-ink'}`}
          >
            {AI_PROVIDER_INFO[p].label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between text-[13px] font-medium">
            API key
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="font-normal text-accent-text underline-offset-4 hover:underline"
            >
              Get a {info.label} key
            </a>
          </span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder={info.keyHint}
            className="field field-mono"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Model</span>
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={info.defaultModel}
            spellCheck={false}
            className="field field-mono"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={key.trim().length < 10}
          className={buttonStyles('primary', 'field')}
        >
          Use my key
        </button>
        <p className="min-w-0 flex-1 text-[12px] text-muted">
          Stays in this browser. Sent with each breakdown for that one call to {info.label}, never
          stored or logged.
        </p>
      </div>
    </form>
  )
}
