// The kinds of evidence a check can use. Receipts works with whatever the user has: a pull
// request is one source, not a requirement. Each source records how much it can prove.

export const EVIDENCE_SOURCE_KINDS = [
  'github_pull_request',
  'github_compare',
  'pasted_diff',
  'agent_summary',
  'test_output',
] as const

export type EvidenceSourceKind = (typeof EVIDENCE_SOURCE_KINDS)[number]

export type EvidenceSourceCopy = {
  label: string
  example: string
  /** What this source can and cannot establish, shown to the user next to the result. */
  provenance: string
}

export const EVIDENCE_SOURCE_COPY: Record<EvidenceSourceKind, EvidenceSourceCopy> = {
  github_pull_request: {
    label: 'GitHub pull request',
    example: 'github.com/you/app/pull/42',
    provenance: 'Changes, description and CI results fetched from GitHub.',
  },
  github_compare: {
    label: 'Branch or commit link',
    example: 'github.com/you/app/compare/main...feature',
    provenance: 'Changes and CI results fetched from GitHub. No description to check.',
  },
  pasted_diff: {
    label: 'Pasted changes',
    example: 'The output of git diff',
    provenance: 'Exactly what you pasted. Receipts cannot see your machine.',
  },
  agent_summary: {
    label: "Your agent's summary",
    example: '"Done. Added rate limiting and tests."',
    provenance: 'The claims to check. Never treated as evidence on its own.',
  },
  test_output: {
    label: 'Test output',
    example: 'The terminal output of npm test',
    provenance: 'Shown as provided by you. Receipts does not re-run it.',
  },
}
