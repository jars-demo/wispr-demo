// The outcome for one thing you asked for. Labels are plain words, and deliberately modest:
// finding a change is evidence, not proof that the change works.

export const VERDICT_KINDS = [
  'evidence_found',
  'partial',
  'not_found',
  'violates_non_goal',
  'unverifiable',
] as const

export type VerdictKind = (typeof VERDICT_KINDS)[number]

export const VERDICT_COPY: Record<VerdictKind, { label: string; meaning: string; needs: string }> =
  {
    evidence_found: {
      label: 'Found',
      meaning: 'The changes contain work that matches what you asked for.',
      needs: 'Every Found points to the exact lines. No lines, no Found.',
    },
    partial: {
      label: 'Partly',
      meaning: 'Some of it is there, or it is there without a test.',
      needs: 'The note says which part is missing.',
    },
    not_found: {
      label: 'Missing',
      meaning: 'Nothing in the changes matches this.',
      needs: 'Worth asking your agent about before you merge.',
    },
    violates_non_goal: {
      label: 'Off-limits',
      meaning: 'Something you said to leave alone was changed.',
      needs: 'The lines that crossed the line are shown.',
    },
    unverifiable: {
      label: "Can't tell",
      meaning: 'There is not enough evidence to decide either way.',
      needs: 'Add more evidence, such as test output, and check again.',
    },
  }
