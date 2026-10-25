'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { toast } from '@/features/fx/toasts'

import { restoreFrom } from './store'

// Opens a restore link. The id and secret live in the URL fragment, which browsers never send to
// the server, and are posted once to fetch the saved progress.

export function Restore() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const [id, secret] = window.location.hash.slice(1).split('.')
    const restore = id && secret ? restoreFrom(id, secret) : null
    void (
      restore ??
      Promise.resolve({ ok: false as const, message: 'This restore link is incomplete.' })
    ).then((result) => {
      if (!result.ok) {
        setError(result.message)
        return
      }
      window.history.replaceState(null, '', '/restore')
      toast({ tone: 'info', title: 'Progress restored', body: 'Welcome back.' })
      router.replace('/me')
    })
  }, [router])

  return (
    <div className="glass mt-10 flex flex-col items-center gap-4 rounded-panel px-6 py-16 text-center">
      {error ? (
        <>
          <p role="alert" className="text-[16px]">
            {error}
          </p>
          <Link href="/" className={buttonStyles('primary')}>
            Back to the wire
          </Link>
        </>
      ) : (
        <p role="status" className="text-[16px]">
          Restoring your progress…
        </p>
      )}
    </div>
  )
}
