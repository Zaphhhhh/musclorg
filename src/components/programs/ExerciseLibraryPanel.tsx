import { useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { filterAndSortExercises, EXERCISE_SORT_OPTIONS } from '../../lib/exerciseSort'
import type { ExerciseSortOption } from '../../lib/exerciseSort'
import type { Exercise } from '../../types/exercise'

function DraggableExercise({ exercise }: { exercise: Exercise }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `exercise-${exercise.id}`,
    data: { type: 'exercise', exercise },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none cursor-grab active:cursor-grabbing bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm select-none ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <p className="font-medium">{exercise.name}</p>
      {exercise.primary_muscle_group && (
        <p className="text-xs text-[var(--text-muted)]">{exercise.primary_muscle_group}</p>
      )}
    </div>
  )
}

export default function ExerciseLibraryPanel({
  exercises,
  loading,
}: {
  exercises: Exercise[]
  loading: boolean
}) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ExerciseSortOption>('Nom (A-Z)')

  const visibleExercises = useMemo(
    () => filterAndSortExercises(exercises, search, sort),
    [exercises, search, sort]
  )

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-[var(--surface)] border border-[var(--border)] p-4 h-fit lg:sticky lg:top-6 max-h-[28rem] lg:max-h-[80vh] overflow-y-auto flex flex-col">
      <h3 className="text-sm mb-1">Bibliotheque</h3>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        Glisse un exo dans une seance pour creer un bloc.
      </p>

      {!loading && exercises.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          <Input
            label="Rechercher"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou groupe..."
            className="text-sm py-1.5"
          />
          <Select
            label="Trier par"
            options={EXERCISE_SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value as ExerciseSortOption)}
            className="text-sm py-1.5"
          />
        </div>
      )}

      {loading ? (
        <p className="text-xs text-[var(--text-muted)]">Chargement...</p>
      ) : exercises.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          Aucun exo. Ajoute-en depuis "Mes exercices".
        </p>
      ) : visibleExercises.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">Aucun exo ne correspond a "{search}".</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleExercises.map((exercise) => (
            <DraggableExercise key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </aside>
  )
}
