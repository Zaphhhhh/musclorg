import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: readonly string[]
}

export default function Select({ label, id, options, className = '', ...props }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={selectId} className="text-sm text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </label>
      <select
        id={selectId}
        className={`bg-[var(--surface-2)] border-2 border-[var(--border)] px-3 py-2.5 text-[var(--text)] focus:border-[var(--pr)] outline-none transition-none text-lg ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
