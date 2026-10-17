import { describe, expect, it } from 'vitest'

import { AGENTS, CURSOR_URL_LIMIT, handoff, isAgentId, quoteForShell } from '@/domain/agent-handoff'

const BRIEF = "# Task: Rate limit\n\n- **R1** Don't lock out admins. Use $LIMIT & `5`."

describe('quoteForShell', () => {
  it('keeps quotes, dollars and backticks literal in POSIX shells', () => {
    expect(quoteForShell("it's $HOME `x`", 'posix')).toBe(`'it'\\''s $HOME \`x\`'`)
  })

  it('doubles single quotes for PowerShell', () => {
    expect(quoteForShell("it's $HOME", 'powershell')).toBe(`'it''s $HOME'`)
  })
})

describe('handoff', () => {
  it('gives terminal agents a command with the whole brief', () => {
    const result = handoff('claude-code', BRIEF, 'posix')
    expect(result.copy.startsWith("claude '# Task: Rate limit")).toBe(true)
    expect(result.copy).toContain(`Don'\\''t lock out admins`)
    expect(result.open).toBeUndefined()
    expect(handoff('codex', BRIEF, 'powershell').copy.startsWith("codex '")).toBe(true)
  })

  it('opens Cursor with the brief encoded, and falls back to copying when too long', () => {
    const short = handoff('cursor', BRIEF, 'posix')
    expect(short.open).toBe(`https://cursor.com/link/prompt?text=${encodeURIComponent(BRIEF)}`)
    expect(short.open).toContain('%26') // & would otherwise cut the prompt short

    const long = handoff('cursor', 'x'.repeat(CURSOR_URL_LIMIT), 'posix')
    expect(long.open).toBeUndefined()
    expect(long.copy).toHaveLength(CURSOR_URL_LIMIT)
  })

  it('always copies the brief for chat sites, in case the link does not fill it in', () => {
    const claude = handoff('claude-web', BRIEF, 'posix')
    expect(claude.open?.startsWith('https://claude.ai/new?q=')).toBe(true)
    expect(claude.copy).toBe(BRIEF)

    const long = handoff('chatgpt', 'x'.repeat(7000), 'posix')
    expect(long.open).toBe('https://chatgpt.com/')
  })

  it('knows every listed agent', () => {
    for (const agent of AGENTS) {
      expect(isAgentId(agent.id)).toBe(true)
      expect(handoff(agent.id, BRIEF, 'posix').note.length).toBeGreaterThan(10)
    }
    expect(isAgentId('emacs')).toBe(false)
  })
})
