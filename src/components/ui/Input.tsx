import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={inputId} className="text-sm text-[var(--text-muted)]">
        {label}
      </label>
      <input
        id={inputId}
        className={`bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] outline-none transition-colors ${className}`}
        {...props}
      />
    </div>
  )
}
