// Hand-drawn accents for the landing page. Decorative only: hidden from assistive tech, and they
// sit still for people who prefer reduced motion (the draw-in animation is skipped).

export function Squiggle({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 24"
      preserveAspectRatio="none"
      className={`doodle-draw pointer-events-none ${className}`}
    >
      <path
        d="M4 16 C 40 6, 70 22, 104 12 S 168 4, 204 14 S 262 20, 296 8"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  )
}

export function DoodleArrow({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 90"
      className={`doodle-draw pointer-events-none ${className}`}
    >
      <path
        d="M10 10 C 30 60, 70 70, 102 66 M90 54 L104 66 L88 76"
        fill="none"
        stroke="var(--ink-2)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  )
}

export function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className={`doodle-twinkle pointer-events-none ${className}`}
    >
      <path
        d="M20 3 C 21 14, 26 19, 37 20 C 26 21, 21 26, 20 37 C 19 26, 14 21, 3 20 C 14 19, 19 14, 20 3 Z"
        fill="var(--accent)"
      />
    </svg>
  )
}
