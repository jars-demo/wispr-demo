// A receipt with a torn edge and an orange tick: proof the work was done.
// Same geometry as src/app/icon.svg, so the favicon and the in-app mark always match.

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#0A0A0A" />
      <path
        d="M19.5 11h25a3.5 3.5 0 0 1 3.5 3.5V52l-4-3-4 3-4-3-4 3-4-3-4 3-4-3-4 3V14.5a3.5 3.5 0 0 1 3.5-3.5Z"
        fill="#FAFAF9"
      />
      <rect x="23" y="18" width="18" height="3" rx="1.5" fill="#D6D6D3" />
      <path
        d="m23.5 33.5 6 6 11.5-12.5"
        fill="none"
        stroke="#FF5A1F"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]">
      <LogoMark />
      Receipts
    </span>
  )
}
