'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { SAMPLE_DIFF, SAMPLE_SUMMARY } from '@/domain/check/sample'
import { ApiError, createCheck } from '@/features/spec/api'

// Step 3: give Receipts what the agent produced. Either paste a diff or point at a public GitHub
// link, plus (optionally) the agent's own summary and the test output.

type Mode = 'paste' | 'link'

const FIELD =
  'w-full rounded-card bg-surface/80 p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted/80 focus-visible:outline-2 focus-visible:outline-accent'

export function CheckForm({
  specId,
  showSample,
  aiEnabled,
}: {
  specId: string
  showSample: boolean
  aiEnabled: boolean
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('paste')
  const [diff, setDiff] = useState('')
  const [link, setLink] = useState('')
  const [summary, setSummary] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = mode === 'paste' ? diff.trim() !== '' : link.trim() !== ''

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const { id } = await createCheck(specId, {
        diff: mode === 'paste' ? diff : '',
        link: mode === 'link' ? link : '',
        summary,
        testOutput,
      })
      router.push(`/specs/${specId}/checks/${id}`)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The check failed. Try again.')
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="flex flex-col gap-6"
    >
      <section className="glass flex flex-col gap-4 rounded-panel p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight">What your agent changed</h2>
          <div
            role="tablist"
            aria-label="How to share the changes"
            className="flex rounded-full bg-surface-2 p-1"
          >
            {(['paste', 'link'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`h-8 rounded-full px-3 text-[13px] font-medium transition-colors ${
                  mode === m ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink'
                }`}
              >
                {m === 'paste' ? 'Paste diff' : 'GitHub link'}
              </button>
            ))}
          </div>
        </div>
        {mode === 'paste' ? (
          <>
            <label htmlFor="diff" className="sr-only">
              The diff
            </label>
            <textarea
              id="diff"
              value={diff}
              onChange={(event) => setDiff(event.target.value)}
              rows={9}
              spellCheck={false}
              placeholder={
                'Paste the output of git diff here.\n\ndiff --git a/src/app/... b/src/app/...'
              }
              className={`${FIELD} font-mono text-[13px]`}
            />
            <p className="text-[13px] text-muted">
              In your project run <code className="font-mono text-ink-2">git diff</code> (or{' '}
              <code className="font-mono text-ink-2">git diff main</code> for a whole branch) and
              paste what it prints.
            </p>
          </>
        ) : (
          <>
            <label htmlFor="link" className="sr-only">
              GitHub link
            </label>
            <input
              id="link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              inputMode="url"
              placeholder="https://github.com/you/app/pull/42"
              className={`${FIELD} h-12 py-0`}
            />
            <p className="text-[13px] text-muted">
              A public pull request, compare or commit link. Private repositories are not supported
              yet; paste the diff instead.
            </p>
          </>
        )}
      </section>

      <section className="glass flex flex-col gap-3 rounded-panel p-4 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight">
          What your agent said <span className="font-normal text-muted">(optional)</span>
        </h2>
        <label htmlFor="summary" className="sr-only">
          The agent&rsquo;s summary
        </label>
        <textarea
          id="summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={4}
          placeholder="Paste the agent's final message, for example: Done! Added tests, all tests pass."
          className={FIELD}
        />
        <details className="group">
          <summary className="cursor-pointer text-[13px] text-muted hover:text-ink">
            Add test output{' '}
            <span className="text-muted">(optional, proves &ldquo;tests pass&rdquo;)</span>
          </summary>
          <label htmlFor="test-output" className="sr-only">
            Test output
          </label>
          <textarea
            id="test-output"
            value={testOutput}
            onChange={(event) => setTestOutput(event.target.value)}
            rows={5}
            spellCheck={false}
            placeholder="Paste what npm test (or your test command) printed."
            className={`${FIELD} mt-3 font-mono text-[13px]`}
          />
        </details>
      </section>

      {aiEnabled ? (
        <p className="px-1 text-[13px] text-muted">
          The changes are sent to Groq for the AI part of the check. Every AI answer must point to
          real lines in your diff, or it is marked Can’t tell. Nothing you paste is stored.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl bg-bad-wash px-4 py-3 text-sm text-bad">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showSample ? (
          <button
            type="button"
            className={buttonStyles('ghost')}
            onClick={() => {
              setMode('paste')
              setDiff(SAMPLE_DIFF)
              setSummary(SAMPLE_SUMMARY)
            }}
          >
            Fill in a sample agent result
          </button>
        ) : (
          <span />
        )}
        <button type="submit" disabled={busy || !ready} className={buttonStyles('primary', 'lg')}>
          {busy ? 'Checking…' : 'Check the work'}
        </button>
      </div>
    </form>
  )
}
