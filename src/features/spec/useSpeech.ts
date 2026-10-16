'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Browser speech recognition as a progressive extra. Typing, or dictating with Wispr Flow or any
// system dictation into the text box, always works without it.

type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>

interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: { resultIndex: number; results: RecognitionResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => Recognition

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const subscribe = () => () => {}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed':
    'Microphone access is blocked. Allow it in your browser settings, or type instead.',
  'service-not-allowed': 'Speech input is turned off in this browser. You can type instead.',
  'no-speech': 'No speech was heard. Try again a little closer to the microphone.',
  'audio-capture': 'No microphone was found. You can type instead.',
  network: 'Browser speech needs an internet connection. You can type instead.',
  'language-not-supported': 'Your browser cannot transcribe this language. You can type instead.',
}

export function useSpeech(onFinal: (text: string) => void) {
  const supported = useSyncExternalStore(
    subscribe,
    () => getCtor() !== null,
    () => false,
  )
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognition = useRef<Recognition | null>(null)
  const onFinalRef = useRef(onFinal)

  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  useEffect(() => () => recognition.current?.abort(), [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor || recognition.current) return
    const r = new Ctor()
    r.lang = navigator.language || 'en-US'
    r.continuous = true
    r.interimResults = true
    r.onresult = (event) => {
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result) continue
        if (result.isFinal) onFinalRef.current(result[0].transcript.trim())
        else pending += result[0].transcript
      }
      setInterim(pending)
    }
    r.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(ERROR_MESSAGES[event.error] ?? 'Speech input stopped. You can type instead.')
      }
    }
    r.onend = () => {
      recognition.current = null
      setListening(false)
      setInterim('')
    }
    setError(null)
    recognition.current = r
    setListening(true)
    try {
      r.start()
    } catch {
      recognition.current = null
      setListening(false)
      setError('Speech input could not start. You can type instead.')
    }
  }, [])

  const stop = useCallback(() => recognition.current?.stop(), [])

  return { supported, listening, interim, error, start, stop }
}
