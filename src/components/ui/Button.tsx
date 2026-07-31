import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  isLoading?: boolean
}

// Effet "bouton pixel-art": ombre dure decalee au repos, qui se
// resorbe et se decale le bouton lui-meme au clic (impression de
// relief qui s'enfonce, comme dans les menus de jeux 16-bit).
const baseStyles =
  'inline-flex items-center justify-center text-xs uppercase tracking-wide px-4 py-3 border-2 transition-none disabled:opacity-40 disabled:cursor-not-allowed active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-white border-[var(--pixel-shadow)] shadow-[3px_3px_0_var(--pixel-shadow)] hover:bg-[var(--accent-hover)]',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] shadow-[3px_3px_0_var(--pixel-shadow)] hover:bg-[var(--surface)] hover:border-[var(--pr)]',
  ghost:
    'bg-transparent text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:border-[var(--border)]',
}

export default function Button({
  variant = 'primary',
  children,
  isLoading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{ fontFamily: 'var(--font-display)' }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? '...' : children}
    </button>
  )
}
