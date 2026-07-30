import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import ExerciseForm from '../components/exercices/ExerciseForm'
import ExerciseCard from '../components/exercices/ExerciseCard'
import Button from '../components/ui/Button'
import type { Exercise } from '../types/exercise'

export default function ExercisesPage() {
  const { exercises, loading, error, createExercise, updateExercise, deleteExercise } =
    useExercises()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (exercise: Exercise) => {
    setEditing(exercise)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet exercice ?')) return
    await deleteExercise(id)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl no-underline text-[var(--text)]">
            MusclOrg
          </Link>
          <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            ← Retour
          </Link>
        </div>
      </header>

      <div className="knurl-divider" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl mb-1">Mes exercices</h2>
            <p className="text-[var(--text-muted)] text-sm">
              Ta bibliotheque d'exos, avec les valeurs par defaut pour chaque bloc.
            </p>
          </div>
          {!formOpen && <Button onClick={openCreate}>+ Ajouter un exercice</Button>}
        </div>

        {formOpen && (
          <div className="mb-8">
            <ExerciseForm
              initial={editing ?? undefined}
              onCancel={closeForm}
              onSubmit={(input) =>
                editing ? updateExercise(editing.id, input) : createExercise(input)
              }
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2 mb-6">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-[var(--text-muted)]">Chargement...</p>
        ) : exercises.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
            <p className="text-[var(--text-muted)]">
              Aucun exercice pour l'instant. Ajoute ton premier exo pour commencer a construire
              tes seances.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises
              .filter((exercise) => exercise.id !== editing?.id)
              .map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={() => openEdit(exercise)}
                  onDelete={() => handleDelete(exercise.id)}
                />
              ))}
          </div>
        )}
      </main>
    </div>
  )
}
