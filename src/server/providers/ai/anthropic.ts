import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'

import { failureForStatus, ModelUnavailableError, type JsonModel } from './types'

// Claude through the official SDK, with structured output from our zod schema and server-side
// fallback, so a policy decline on one model is retried on the default fallback model.

export function createAnthropicModel(apiKey: string, model: string): JsonModel {
  const client = new Anthropic({ apiKey, maxRetries: 1 })
  return {
    provider: 'anthropic',
    model,
    async run(request) {
      try {
        const response = await client.beta.messages.parse(
          {
            model,
            max_tokens: request.maxTokens,
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            system: request.system,
            messages: [{ role: 'user', content: request.user }],
            output_config: { format: betaZodOutputFormat(request.validate) },
          },
          { timeout: request.timeoutMs },
        )
        if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
          throw new ModelUnavailableError('invalid_output')
        }
        const parsed = request.validate.safeParse(response.parsed_output)
        if (!parsed.success) throw new ModelUnavailableError('invalid_output')
        return parsed.data
      } catch (error) {
        if (error instanceof ModelUnavailableError) throw error
        if (error instanceof Anthropic.APIConnectionTimeoutError) {
          throw new ModelUnavailableError('timeout')
        }
        if (error instanceof Anthropic.APIError && typeof error.status === 'number') {
          throw new ModelUnavailableError(failureForStatus(error.status))
        }
        throw new ModelUnavailableError('invalid_output')
      }
    },
  }
}
