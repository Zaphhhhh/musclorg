interface ChipMultiSelectProps {
  label: string
  options: readonly string[]
  value: string[]
  onChange: (value: string[]) => void
}

export default function ChipMultiSelect({ label, options, value, onChange }: ChipMultiSelectProps) {
  const toggle = (option: string) => {
    if (value.includes(option)) onChange(value.filter((v) => v !== option))
    else onChange([...value, option])
  }

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-sm text-[var(--text-muted)] uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`text-xs px-2.5 py-1.5 border-2 transition-none ${
                selected
                  ? 'bg-[var(--accent)] border-[var(--pixel-shadow)] text-white shadow-[2px_2px_0_var(--pixel-shadow)]'
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--pr)]'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
