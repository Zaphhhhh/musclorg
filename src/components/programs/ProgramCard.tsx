import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { TrashIcon } from '../ui/icons'
import type { Program } from '../../types/program'

interface ProgramCardProps {
  program: Program
  onUpdate: (name: string, description: string) => Promise<{ error: string | null }>
  onDelete: () => void
}

export default function ProgramCard({ program, onUpdate, onDelete }: ProgramCardProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(program.name)
  const [description, setDescription] = useState(program.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await onUpdate(name, description)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setEditing(false)
  }

  const cancelEdit = () => {
    setName(program.name)
    setDescription(program.description ?? '')
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="bg-[var(--surface)] border border-[var(--accent)] rounded-xl p-5 flex flex-col gap-3"
      >
        <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" isLoading={submitting} className="text-xs px-3 py-1.5">
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={cancelEdit}
            className="text-xs px-3 py-1.5"
          >
            Annuler
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base normal-case tracking-normal font-semibold">{program.name}</h3>
          {program.description && (
            <p className="text-sm text-[var(--text-muted)] mt-1">{program.description}</p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] shrink-0"
          aria-label="Modifier le programme"
        >
          Modifier
        </button>
      </div>
      <div className="flex gap-2 mt-1">
        <Link to={`/programs/${program.id}`}>
          <Button variant="secondary" className="text-xs px-3 py-1.5">
            Ouvrir
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={onDelete}
          className="px-2 py-1.5 text-[var(--danger)]"
          aria-label="Supprimer le programme"
          title="Supprimer le programme"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
