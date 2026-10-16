'use client'

// Floating glass action bar pinned to the bottom of the screen while reviewing a checklist.

export function SaveBar({ error, children }: { error: string | null; children: React.ReactNode }) {
  return (
    <div className="sticky bottom-4 z-30 mt-10">
      <div className="glass-strong flex flex-col gap-2 rounded-panel p-2.5 sm:flex-row sm:items-center sm:justify-between sm:p-3">
        <p role="alert" className={`px-2 text-sm text-bad ${error ? '' : 'hidden sm:block'}`}>
          {error}
        </p>
        <div className="flex items-center justify-end gap-2">{children}</div>
      </div>
    </div>
  )
}
