import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import ExerciseForm from '../components/exercices/ExerciseForm'
import ExerciseCard from '../components/exercices/ExerciseCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Logo from '../components/ui/Logo'
import { filterAndSortExercises, EXERCISE_SORT_OPTIONS } from '../lib/exerciseSort'
import type { ExerciseSortOption } from '../lib/exerciseSort'
import type { Exercise } from '../types/exercise'

export default function ExercisesPage() {
  const { exercises, loading, error, createExercise, updateExercise, deleteExercise } =
    useExercises()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ExerciseSortOption>('Nom (A-Z)')

  const visibleExercises = useMemo(
    () =>
      filterAndSortExercises(exercises, search, sort).filter((ex) => ex.id !== editing?.id),
    [exercises, search, sort, editing]
  )

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
    setDeleteError(null)
    const { error } = await deleteExercise(id)
    if (error) setDeleteError(error)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
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
              key={editing?.id ?? 'new'}
              initial={editing ?? undefined}
              onCancel={closeForm}
              onSubmit={(input) =>
                editing ? updateExercise(editing.id, input) : createExercise(input)
              }
            />
          </div>
        )}

        {(error || deleteError) && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2 mb-6">
            {error || deleteError}
          </p>
        )}

        {!loading && exercises.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="w-64">
              <Input
                label="Rechercher"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom ou groupe musculaire..."
              />
            </div>
            <div className="w-52">
              <Select
                label="Trier par"
                options={EXERCISE_SORT_OPTIONS}
                value={sort}
                onChange={(e) => setSort(e.target.value as ExerciseSortOption)}
              />
            </div>
          </div>
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
        ) : visibleExercises.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
            <p className="text-[var(--text-muted)]">Aucun exercice ne correspond a "{search}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleExercises.map((exercise) => (
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
