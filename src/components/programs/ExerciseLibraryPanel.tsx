import { useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { filterAndSortExercises, EXERCISE_SORT_OPTIONS } from '../../lib/exerciseSort'
import type { ExerciseSortOption } from '../../lib/exerciseSort'
import { COMMON_EXERCISES } from '../../lib/commonExercises'
import type { CommonExercise } from '../../lib/commonExercises'
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

function DraggableCommonExercise({ exercise, index }: { exercise: CommonExercise; index: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `common-exercise-${index}`,
    data: { type: 'common-exercise', exercise },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none cursor-grab active:cursor-grabbing bg-[var(--surface-2)] border border-dashed border-[var(--border)] rounded-lg px-3 py-2 text-sm select-none ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <p className="font-medium">{exercise.name}</p>
      <p className="text-xs text-[var(--text-muted)]">{exercise.primary_muscle_group}</p>
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
  const [tab, setTab] = useState<'mine' | 'common'>('mine')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ExerciseSortOption>('Nom (A-Z)')

  const visibleExercises = useMemo(
    () => filterAndSortExercises(exercises, search, sort),
    [exercises, search, sort]
  )

  const visibleCommon = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? COMMON_EXERCISES.filter(
          (e) =>
            e.name.toLowerCase().includes(q) || e.primary_muscle_group.toLowerCase().includes(q)
        )
      : COMMON_EXERCISES
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [search])

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-[var(--surface)] border border-[var(--border)] p-4 h-fit lg:sticky lg:top-6 max-h-[28rem] lg:max-h-[80vh] overflow-y-auto flex flex-col">
      <h3 className="text-sm mb-1">Bibliotheque</h3>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        Glisse un exo dans une seance pour creer un bloc.
      </p>

      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setTab('mine')}
          className={`flex-1 text-xs px-2 py-1.5 ${
            tab === 'mine'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
          }`}
        >
          Mes exercices
        </button>
        <button
          onClick={() => setTab('common')}
          className={`flex-1 text-xs px-2 py-1.5 ${
            tab === 'common'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
          }`}
        >
          Courants
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        <Input
          label="Rechercher"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom ou groupe..."
          className="text-sm py-1.5"
        />
        {tab === 'mine' && (
          <Select
            label="Trier par"
            options={EXERCISE_SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value as ExerciseSortOption)}
            className="text-sm py-1.5"
          />
        )}
      </div>

      {tab === 'mine' ? (
        loading ? (
          <p className="text-xs text-[var(--text-muted)]">Chargement...</p>
        ) : exercises.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            Aucun exo. Ajoute-en depuis "Mes exercices", ou pioche dans l'onglet "Courants".
          </p>
        ) : visibleExercises.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">Aucun exo ne correspond a "{search}".</p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleExercises.map((exercise) => (
              <DraggableExercise key={exercise.id} exercise={exercise} />
            ))}
          </div>
        )
      ) : (
        <>
          <p className="text-xs text-[var(--pr)] mb-2">
            Glisser un exo courant l'ajoute automatiquement a tes exercices.
          </p>
          {visibleCommon.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">Aucun exo ne correspond a "{search}".</p>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleCommon.map((exercise, i) => (
                <DraggableCommonExercise key={exercise.name} exercise={exercise} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  )
}
