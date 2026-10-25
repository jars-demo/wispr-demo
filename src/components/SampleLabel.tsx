export function SampleLabel({
  children = 'Static mockup with sample data',
}: {
  children?: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-hairline-strong px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted uppercase">
      {children}
    </span>
  )
}
