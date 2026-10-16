import 'server-only'

import { z } from 'zod'

import { SPEC_ITEM_KINDS } from '@/domain/spec'
import type { GroqConfig } from '@/server/config'
import { groqJson, ModelUnavailableError } from '@/server/providers/groq'

import { STRUCTURE_SYSTEM } from './anthropic'
import { groundModelOutput } from './grounding'
import { StructurerUnavailableError, type ModelStructurer } from './types'

// Groq-backed structuring with the same prompt and the same grounding as the Claude adapter.

const schema = z.object({
  title: z.string(),
  items: z.array(
    z.object({
      kind: z.enum(SPEC_ITEM_KINDS),
      text: z.string(),
      acceptance: z.string().nullable(),
      source_quote: z.string(),
      note: z.string().nullable(),
    }),
  ),
})

const JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'items'],
  properties: {
    title: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'text', 'acceptance', 'source_quote', 'note'],
        properties: {
          kind: { type: 'string', enum: [...SPEC_ITEM_KINDS] },
          text: { type: 'string' },
          acceptance: { type: ['string', 'null'] },
          source_quote: { type: 'string' },
          note: { type: ['string', 'null'] },
        },
      },
    },
  },
}

export function createGroqStructurer(config: GroqConfig): ModelStructurer {
  return async (transcript) => {
    try {
      const raw = await groqJson({
        apiKey: config.apiKey,
        model: config.structureModel,
        system: STRUCTURE_SYSTEM,
        user: `<transcript>\n${transcript}\n</transcript>`,
        schemaName: 'checklist',
        jsonSchema: JSON_SCHEMA,
        validate: schema,
      })
      return groundModelOutput(transcript, raw)
    } catch (error) {
      if (error instanceof ModelUnavailableError) {
        throw new StructurerUnavailableError(
          error.reason === 'rate_limited'
            ? 'rate_limited'
            : error.reason === 'invalid_output'
              ? 'invalid_output'
              : 'provider_error',
        )
      }
      throw error
    }
  }
}
