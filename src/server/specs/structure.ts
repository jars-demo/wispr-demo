import type { SpecItemInput, StructuringEngine } from '@/domain/spec'
import { structureWithRules } from '@/domain/structure-rules'
import {
  StructurerUnavailableError,
  type ModelStructurer,
} from '@/server/providers/structurer/types'

// Chooses how to structure a transcript. The model is used when configured; if it is missing or
// fails, the deterministic rules engine runs instead and the user is told which one was used.

export type StructureResult = {
  engine: StructuringEngine
  title: string
  items: SpecItemInput[]
  notices: string[]
}

export async function structureTranscript(
  transcript: string,
  model: ModelStructurer | null,
): Promise<StructureResult> {
  if (model) {
    try {
      const output = await model(transcript)
      if (output.items.some((item) => item.kind === 'requirement')) {
        const notices =
          output.droppedUngrounded > 0
            ? [
                `${output.droppedUngrounded} suggested item${output.droppedUngrounded === 1 ? ' was' : 's were'} removed because ${output.droppedUngrounded === 1 ? 'it was' : 'they were'} not in what you said.`,
              ]
            : []
        return { engine: 'model', title: output.title, items: output.items, notices }
      }
    } catch (error) {
      if (!(error instanceof StructurerUnavailableError)) throw error
      const rules = structureWithRules(transcript)
      return {
        engine: 'rules',
        ...rules,
        notices: ['AI structuring was unavailable, so the built-in rules were used.'],
      }
    }
  }
  return { engine: 'rules', ...structureWithRules(transcript), notices: [] }
}
