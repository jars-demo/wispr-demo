// A receipt with a torn edge and a tick: "proof it was done".

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <path
        d="M10 7.5h12a1 1 0 0 1 1 1V24l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4V8.5a1 1 0 0 1 1-1Z"
        className="fill-canvas"
      />
      <path
        d="m12.6 15.4 2.4 2.4 4.6-5"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-accent"
      />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight">
      <LogoMark />
      Receipts
    </span>
  )
}
