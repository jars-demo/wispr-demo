// "Hold the key and talk": Wispr Flow types into whichever box has focus, so this is the only
// voice instruction the app needs.

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-hairline-strong bg-surface px-1.5 font-sans text-[12px] font-medium text-ink shadow-[0_1px_0_var(--hairline-strong)]">
      {children}
    </kbd>
  )
}

export function WisprHint() {
  return (
    <div className="flex flex-wrap items-center gap-2 px-2 pt-1 text-[13px] text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <span className="key-pulse size-2 rounded-full bg-accent" aria-hidden="true" />
        Talk with Wispr Flow: click the box, hold
      </span>
      <span className="inline-flex items-center gap-1">
        <Key>Fn</Key>
        <span className="text-muted">on Mac</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Key>Ctrl</Key>
        <span className="text-muted">+</span>
        <Key>Win</Key>
        <span className="text-muted">on Windows</span>
      </span>
    </div>
  )
}
