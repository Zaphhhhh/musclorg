import { useState } from 'react'
import Button from '../ui/Button'

interface CopyOption {
  id: string
  label: string
}

interface CopyPickerProps {
  label: string
  options: CopyOption[]
  onConfirm: (targetId: string) => void
  onCancel: () => void
}

export default function CopyPicker({ label, options, onConfirm, onCancel }: CopyPickerProps) {
  const [target, setTarget] = useState(options[0]?.id ?? '')

  if (options.length === 0) {
    return (
      <p className="text-xs text-[var(--text-muted)]">
        Aucune autre destination disponible pour l'instant.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2">
      <label className="text-xs text-[var(--text-muted)]">{label}</label>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text)]"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button onClick={() => onConfirm(target)} className="text-xs px-2 py-1">
          Copier ici
        </Button>
        <Button variant="secondary" onClick={onCancel} className="text-xs px-2 py-1">
          Annuler
        </Button>
      </div>
    </div>
  )
}
