// A block breaking into pieces, one orange piece flying off: understanding by taking apart.
// Same geometry as src/app/icon.svg, so the favicon and the in-app mark always match.

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#141412" />
      <path d="M15 15h19l-4 14-15 4Z" fill="#FBF8F1" />
      <path d="M37 15h12v20l-15-4Z" fill="#FBF8F1" />
      <path d="M15 36l15-4 4 17H15Z" fill="#FBF8F1" />
      <path d="M38 37l14 3v12H40Z" fill="#FF5A1F" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]">
      <LogoMark />
      Breakdown
    </span>
  )
}
