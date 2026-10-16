import { groupByKind, type SpecItem } from './spec'

// Formats a saved checklist for a coding agent or an issue tracker. Pure string building, so the
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

/** A prompt for a coding agent that asks for a summary Receipts can check afterwards. */
export function toAgentPrompt(spec: ExportableSpec): string {
  const groups = groupByKind(spec.items)
  const questions =
    groups.open_question.length > 0
      ? [
          'Before you start, ask me these questions and wait for my answers:',
          ...groups.open_question.map(line),
          '',
        ]
      : []
  return [
    `Task: ${spec.title}`,
    '',
    ...questions,
    'Implement every requirement below:',
    ...groups.requirement.map(line),
    '',
    ...(groups.non_goal.length > 0
      ? ['Do not change any of the following:', ...groups.non_goal.map(line), '']
      : []),
    'When you finish, reply with a summary that lists each requirement code (R1, R2, ...),',
    'what you changed for it, and the exact commands you ran with their results.',
    'Do not say tests pass unless you ran them and saw them pass.',
  ].join('\n')
}
