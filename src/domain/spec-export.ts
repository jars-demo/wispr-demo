import { groupByKind, type SpecItem } from './spec'

// Formats a saved receipt for a coding agent or an issue tracker. Pure string building, so the
// exact text users paste into their agent is covered by tests.

export type ExportableSpec = { title: string; items: readonly SpecItem[] }

function line(item: SpecItem): string {
  const done = item.acceptance ? ` Done when: ${item.acceptance}` : ''
  return `- **${item.code}** ${item.text}${done}`
}

function section(heading: string, items: readonly SpecItem[]): string[] {
  return items.length === 0 ? [] : [`## ${heading}`, '', ...items.map(line), '']
}

/** Markdown that works as a GitHub issue body or an AGENTS.md section. */
export function toMarkdown(spec: ExportableSpec): string {
  const groups = groupByKind(spec.items)
  return [
    `# ${spec.title}`,
    '',
    ...section('Requirements', groups.requirement),
    ...section('Do not change', groups.non_goal),
    ...section('Open questions', groups.open_question),
  ]
    .join('\n')
    .trimEnd()
    .concat('\n')
}

/**
 * A full brief for a coding agent: the task, every requirement with its code, what to leave
 * alone, questions to settle first, how to work, and a report format Receipts can check. Only
 * the receipt items carry the user's content; everything else is fixed working practice, so
 * nothing is invented about what the user wants.
 */
export function toAgentPrompt(spec: ExportableSpec): string {
  const groups = groupByKind(spec.items)
  const has = (list: readonly SpecItem[]) => list.length > 0
  return [
    `# Task: ${spec.title}`,
    '',
    'You are working in my repository. This brief was organised from what I asked for. Do every',
    'requirement below and nothing more. Keep the codes (R1, R2, ...) so I can check your work.',
    '',
    '## Before you start',
    '',
    ...(has(groups.open_question)
      ? [
          'Ask me these questions and wait for my answers before you change any code:',
          ...groups.open_question.map(line),
          '',
        ]
      : []),
    "1. Read the project's own instructions first (README, AGENTS.md, CLAUDE.md, CONTRIBUTING.md)",
    '   and follow its conventions.',
    '2. Read the code each requirement touches before you change it.',
    '',
    '## Requirements',
    '',
    ...groups.requirement.map(line),
    '',
    ...(has(groups.non_goal) ? ['## Do not change', '', ...groups.non_goal.map(line), ''] : []),
    '## How to work',
    '',
    '- Make the smallest change that meets each requirement, in the style of the existing code.',
    '- Add or update tests for each requirement where the project has tests.',
    "- Run the project's checks (tests, lint, type checks) and fix anything you broke.",
    '- Do not add features, refactors or dependencies I did not ask for.',
    '- If something blocks a requirement, stop and tell me instead of working around it.',
    '',
    '## When you finish',
    '',
    'Reply with this report:',
    '',
    '### Summary',
    'One or two sentences on what changed.',
    '',
    '### Requirements',
    ...groups.requirement.map(
      (item) => `- ${item.code}: done, partly or not done. Files changed and how it meets it.`,
    ),
    '',
    '### Commands',
    'Every command you ran and its result (for tests, the pass and fail counts).',
    '',
    '### Not done or unsure',
    'Anything you skipped, assumed or could not finish.',
    '',
    'Do not say tests pass unless you ran them and saw them pass.',
  ].join('\n')
}
