import type { SpecItemInput } from '@/domain/spec'

// A model-backed structurer. Implementations must return only items grounded in the transcript.

export type ModelStructureOutput = {
  title: string
  items: SpecItemInput[]
  /** Items the model proposed whose quote was not found in the transcript, and so were dropped. */
  droppedUngrounded: number
}

export type ModelStructurer = (transcript: string) => Promise<ModelStructureOutput>

export class StructurerUnavailableError extends Error {
  override name = 'StructurerUnavailableError'
  constructor(
    readonly reason: 'refusal' | 'rate_limited' | 'provider_error' | 'invalid_output',
    options?: { cause?: unknown },
  ) {
    super(`Model structuring unavailable: ${reason}`, options)
  }
}
