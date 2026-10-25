'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { parseChangeLink } from '@/domain/feed'

import { looksLikeDiff, PASTE_KEY } from './links'

// One box for anything: a GitHub pull request, commit or compare link, or a raw diff.

export function SearchBar() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const text = value.trim()
    if (!text) return
    if (looksLikeDiff(text)) {
      try {
        window.sessionStorage.setItem(PASTE_KEY, text)
      } catch {
        setError('Your browser blocked storage, so the diff cannot be passed on. Use a link.')
        return
      }
      router.push('/b?paste=1')
      return
    }
    const link = parseChangeLink(text)
    if (!link) {
      setError('Paste a GitHub pull request, commit or compare link, or a diff.')
      return
    }
    router.push(`/b?url=${encodeURIComponent(link.url)}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" role="search">
      <div className="glow-box glass-strong flex items-center gap-2 rounded-full p-1.5 pl-5">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          className="shrink-0 text-muted"
        >
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <label htmlFor="search" className="sr-only">
          A pull request, commit link or diff
        </label>
        <input
          id="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData('text')
            if (text.includes('\n')) {
              event.preventDefault()
              setValue(text)
            }
          }}
          placeholder="Paste any GitHub PR, commit, or a diff"
          autoComplete="off"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        <button type="submit" className={`${buttonStyles('primary', 'lg')} h-11 shrink-0 px-5`}>
          <span className="hidden sm:inline">Break it down</span>
          <span className="sm:hidden">Go</span>
        </button>
      </div>
      {error ? (
        <p role="alert" className="px-5 text-[13px] text-bad">
          {error}
        </p>
      ) : (
        <p className="px-5 text-[13px] text-muted">
          Try a senior engineer&apos;s PR from any public repo. Big ones work too.
        </p>
      )}
    </form>
  )
}
