// How to get a brief into each agent. A web page cannot run commands on your machine, so each
// agent gets the most direct route that really exists: a terminal command to paste, or a link
// that opens the agent with the brief filled in. Pure functions, unit tested.

export type AgentId =
  | 'copilot'
  | 'claude-github'
  | 'claude-code'
  | 'codex'
  | 'cursor'
  | 'claude-web'
  | 'chatgpt'
  | 'other'
export type Shell = 'posix' | 'powershell'

/** github: Receipts opens an issue and the agent starts on its own. local: you run it. */
export type AgentKind = 'github' | 'local' | 'chat'

export type Agent = { id: AgentId; name: string; hint: string; kind: AgentKind }

export const AGENTS: readonly Agent[] = [
  { id: 'copilot', name: 'Copilot', hint: 'Opens an issue and assigns Copilot', kind: 'github' },
  { id: 'claude-github', name: 'Claude', hint: 'Opens an issue for @claude', kind: 'github' },
  { id: 'claude-code', name: 'Claude Code', hint: 'Copies a terminal command', kind: 'local' },
  { id: 'codex', name: 'Codex CLI', hint: 'Copies a terminal command', kind: 'local' },
  { id: 'cursor', name: 'Cursor', hint: 'Opens Cursor with the brief', kind: 'local' },
  { id: 'claude-web', name: 'Claude.ai', hint: 'Opens a new chat', kind: 'chat' },
  { id: 'chatgpt', name: 'ChatGPT', hint: 'Opens a new chat', kind: 'chat' },
  { id: 'other', name: 'Anything else', hint: 'Copies the brief', kind: 'chat' },
]

/** Cursor's documented limit for deeplink URLs. */
export const CURSOR_URL_LIMIT = 8000
/** Keep chat links well under common URL limits; longer briefs go through the clipboard. */
const CHAT_URL_LIMIT = 6000

export function isAgentId(value: unknown): value is AgentId {
  return AGENTS.some((agent) => agent.id === value)
}

export function agentName(id: string | null): string {
  return AGENTS.find((agent) => agent.id === id)?.name ?? 'your agent'
}

/** One quoted argument, safe to paste: nothing inside is expanded by the shell. */
export function quoteForShell(text: string, shell: Shell): string {
  return shell === 'powershell'
    ? `'${text.replace(/'/g, "''")}'`
    : `'${text.replace(/'/g, `'\\''`)}'`
}

export type Handoff = {
  /** Text to put on the clipboard. */
  copy: string
  /** A link to open in a new tab, when the agent has one. */
  open?: string
  /** What to tell the user next. */
  note: string
}

/** For local and chat agents. GitHub agents are sent through the GitHub API instead. */
export function handoff(agent: AgentId, brief: string, shell: Shell): Handoff {
  switch (agent) {
    case 'copilot':
    case 'claude-github':
      return { copy: brief, note: 'Brief copied. Connect GitHub to send it directly.' }
    case 'claude-code':
      return {
        copy: `claude ${quoteForShell(brief, shell)}`,
        note: 'Command copied. Paste it into a terminal in your project folder.',
      }
    case 'codex':
      return {
        copy: `codex ${quoteForShell(brief, shell)}`,
        note: 'Command copied. Paste it into a terminal in your project folder.',
      }
    case 'cursor': {
      const url = `https://cursor.com/link/prompt?text=${encodeURIComponent(brief)}`
      return url.length <= CURSOR_URL_LIMIT
        ? { copy: brief, open: url, note: 'Opening Cursor. Confirm the prompt there to start.' }
        : { copy: brief, note: 'Brief copied (too long for a Cursor link). Paste it into Cursor.' }
    }
    case 'claude-web':
    case 'chatgpt': {
      const base = agent === 'claude-web' ? 'https://claude.ai/new' : 'https://chatgpt.com/'
      const url = `${base}?q=${encodeURIComponent(brief)}`
      return url.length <= CHAT_URL_LIMIT
        ? {
            copy: brief,
            open: url,
            note: 'Opening a new chat. The brief is also copied, in case it is not filled in.',
          }
        : { copy: brief, open: base, note: 'Opening a new chat. The brief is copied: paste it in.' }
    }
    case 'other':
      return { copy: brief, note: 'Brief copied. Paste it into your agent.' }
  }
}
