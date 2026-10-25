import 'server-only'

import {
  groundBreakdown,
  rawBreakdownSchema,
  RAW_BREAKDOWN_JSON_SCHEMA,
  UngroundedBreakdownError,
  type Breakdown,
} from '@/domain/breakdown'
import { BIG_DIFF_LIMITS, DIFF_LIMITS, parseDiff, type ParsedDiff } from '@/domain/diff'
import { ModelUnavailableError, type JsonModel } from '@/server/providers/ai'

import { BREAKDOWN_SYSTEM, breakdownUserMessage, type ChangeOrigin } from './prompt'

export type BreakdownResult = {
  breakdown: Breakdown
  diff: ParsedDiff
  /** References the model made up and grounding removed. Shown to the player, never hidden. */
  dropped: number
  model: string
}

export type BreakdownErrorCode =
  'empty_diff' | 'busy' | 'too_large' | 'bad_key' | 'model_failed' | 'ungrounded'

export class BreakdownError extends Error {
  override name = 'BreakdownError'
  constructor(
    readonly code: BreakdownErrorCode,
    readonly userMessage: string,
  ) {
    super(code)
  }
}

const FAILURE_COPY: Record<string, [BreakdownErrorCode, string]> = {
  rate_limited: ['busy', 'The AI is busy right now. Try again in a minute, or add your own key.'],
  too_large: [
    'too_large',
    'This change is too big for the free AI in one go. Break it down file by file, or add your own AI key in Settings.',
  ],
  auth: ['bad_key', 'Your AI provider did not accept that key. Check it in Settings.'],
}

// Budgets to try, biggest first. When a provider says the request is too large, the next one
// covers fewer files (the most important first) and the rest stay listed for file-by-file rounds.
const SHARED_LADDER = [DIFF_LIMITS.lines, 320, 160]
const OWN_LADDER = [BIG_DIFF_LIMITS.lines, 1200, 500]

export async function createBreakdown(
  model: JsonModel,
  input: {
    diffText: string
    title: string | null
    only: string[] | null
    ownKey: boolean
    origin: ChangeOrigin
  },
): Promise<BreakdownResult> {
  const files = input.ownKey ? BIG_DIFF_LIMITS.files : DIFF_LIMITS.files
  const ladder = input.ownKey ? OWN_LADDER : SHARED_LADDER
  const only = input.only ?? undefined

  for (const [step, lines] of ladder.entries()) {
    const diff = parseDiff(input.diffText, { files, lines, only })
    if (!diff.files.length) {
      throw new BreakdownError(
        'empty_diff',
        diff.skipped.files.length
          ? 'This change only touches lock files, build output or binaries. Nothing to break down.'
          : 'That does not look like a code change. Paste a unified diff or a GitHub link.',
      )
    }
    try {
      const raw = await model.run({
        system: BREAKDOWN_SYSTEM,
        user: breakdownUserMessage(diff, input.title, Boolean(input.only), input.origin),
        schemaName: 'breakdown',
        jsonSchema: RAW_BREAKDOWN_JSON_SCHEMA,
        validate: rawBreakdownSchema,
        timeoutMs: 90_000,
        maxTokens: input.ownKey ? 16_000 : 8_000,
      })
      const { breakdown, dropped } = groundBreakdown(diff, raw)
      return { breakdown, diff, dropped, model: `${model.provider}/${model.model}` }
    } catch (error) {
      const tooLarge = error instanceof ModelUnavailableError && error.reason === 'too_large'
      if (tooLarge && step < ladder.length - 1) continue
      throw mapError(error)
    }
  }
  throw new BreakdownError('model_failed', 'The AI did not answer properly. Try again.')
}

function mapError(error: unknown): unknown {
  if (error instanceof UngroundedBreakdownError) {
    return new BreakdownError(
      'ungrounded',
      'The AI could not tie its explanation to real lines, so we did not show it. Try again.',
    )
  }
  if (error instanceof ModelUnavailableError) {
    const [code, message] = FAILURE_COPY[error.reason] ?? [
      'model_failed',
      'The AI did not answer properly. Try again.',
    ]
    return new BreakdownError(code, message)
  }
  return error
}
