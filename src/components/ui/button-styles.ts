// Shared class names so links and buttons look identical without a polymorphic component.

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost'
/** `field` matches the height of a .field input, for buttons beside one. */
export type ButtonSize = 'md' | 'field' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight ' +
  'transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out ' +
  'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-canvas hover:opacity-90',
  accent: 'bg-accent text-accent-on hover:brightness-105',
  secondary: 'glass text-ink hover:bg-surface',
  ghost: 'text-muted hover:text-ink',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'h-9 px-4 text-sm',
  field: 'h-11 px-5 text-[15px] shrink-0',
  lg: 'h-12 px-6 text-[15px]',
}

export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`
}
