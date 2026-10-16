import type { CheckResult } from './engine'

// Plain-language summaries of a check: one line to read aloud, and a follow-up prompt that asks
// the agent to fix exactly what is missing or untrue.

export function describeCheck(result: CheckResult): string {
  const { found, partly, missing, cantTell, total } = result.summary
  const parts = [`${found} of ${total} found`]
  if (partly) parts.push(`${partly} partly done`)
  if (missing) parts.push(`${missing} missing`)
  if (cantTell) parts.push(`${cantTell} I can't tell`)
  const untrue = result.claims.filter((c) => c.status === 'contradicted').length
  const touched = result.nonGoals.filter((n) => n.status === 'violated').length
  if (touched) parts.push(`${touched} off-limits change${touched === 1 ? '' : 's'}`)
  if (untrue) parts.push(`${untrue} claim${untrue === 1 ? ' is' : 's are'} not true`)
  return `${parts.join(', ')}.`
}

export function toFixPrompt(title: string, result: CheckResult): string | null {
  const todo = result.requirements.filter(
    (r) => r.verdict === 'not_found' || r.verdict === 'partial',
  )
  const unsure = result.requirements.filter((r) => r.verdict === 'unverifiable')
  const touched = result.nonGoals.filter((n) => n.status === 'violated')
  const untrue = result.claims.filter((c) => c.status === 'contradicted')
  if (todo.length + unsure.length + touched.length + untrue.length === 0) return null

  const lines = [`Follow-up on: ${title}`, '', 'A check of your changes found these gaps:', '']
  for (const r of todo) lines.push(`- **${r.code}** ${r.text} (${r.reason})`)
  for (const r of unsure)
    lines.push(`- **${r.code}** ${r.text} (could not be confirmed: show where it is done)`)
  for (const n of touched) lines.push(`- **${n.code}** ${n.text} (this was changed: undo it)`)
  for (const c of untrue)
    lines.push(
      `- You said "${c.text}" but ${c.evidence.charAt(0).toLowerCase()}${c.evidence.slice(1)}`,
    )
  lines.push(
    '',
    'Fix these, then reply with a summary listing each code, what you changed and the exact',
    'commands you ran with their results. Do not say tests pass unless you ran them.',
  )
  return lines.join('\n')
}
