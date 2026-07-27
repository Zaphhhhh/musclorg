import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  isLoading?: boolean
}

const baseStyles =
  'inline-flex items-center justify-center rounded-md font-medium text-sm px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)]',
  ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
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
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Chargement...' : children}
    </button>
  )
}
