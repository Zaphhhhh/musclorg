import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrograms } from '../hooks/usePrograms'
import ProgramCard from '../components/programs/ProgramCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function ProgramsPage() {
  const { programs, loading, error, createProgram, updateProgram, deleteProgram } = usePrograms()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const { error } = await createProgram(name, description)
    if (error) {
      setFormError(error)
      return
    }
    setName('')
    setDescription('')
    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce programme et tout son contenu ?')) return
    await deleteProgram(id)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl no-underline text-[var(--text)]">
            MusclOrg
          </Link>
          <Link to="/">
            <Button variant="secondary" className="p-2" aria-label="Retour" title="Retour">
              ◂
            </Button>
          </Link>
        </div>
      </header>
      <div className="knurl-divider" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl mb-1">Mes programmes</h2>
            <p className="text-[var(--text-muted)] text-sm">
              Un programme regroupe tes phases, semaines et seances.
            </p>
          </div>
          {!creating && <Button onClick={() => setCreating(true)}>+ Nouveau programme</Button>}
        </div>

        {creating && (
          <form
            onSubmit={handleCreate}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4 mb-8 max-w-md"
          >
            <Input
              label="Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Prep powerlifting hiver"
              required
            />
            <Input
              label="Description (optionnel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: 12 semaines, focus force"
            />
            {formError && (
              <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2">
                {formError}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit">Creer</Button>
              <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {error && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2 mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-[var(--text-muted)]">Chargement...</p>
        ) : programs.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
            <p className="text-[var(--text-muted)]">
              Aucun programme pour l'instant. Cree ton premier programme pour commencer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onUpdate={(name, description) => updateProgram(program.id, name, description)}
                onDelete={() => handleDelete(program.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
