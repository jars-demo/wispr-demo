// Words a developer might say, drifting slowly around the voice orb. Purely decorative: hidden
// from assistive tech, and still for people who prefer reduced motion.

const PHRASE =
  'add rate limiting to login · don’t touch signup · maybe log blocked attempts · add tests for the reset · '

export function WordOrbit() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 300"
      className="word-orbit pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        <path id="orbit-path" d="M150 150 m-118 0 a118 118 0 1 1 236 0 a118 118 0 1 1 -236 0" />
      </defs>
      <text className="fill-muted/70 font-display text-[15px] italic">
        <textPath href="#orbit-path">{PHRASE}</textPath>
      </text>
    </svg>
  )
}
