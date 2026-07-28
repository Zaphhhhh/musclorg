import { useDraggable } from '@dnd-kit/core'
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
      className={`cursor-grab active:cursor-grabbing bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm select-none ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <p className="font-medium">{exercise.name}</p>
      {exercise.muscle_group && (
        <p className="text-xs text-[var(--text-muted)]">{exercise.muscle_group}</p>
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

  return (
    <aside className="w-64 shrink-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 h-fit sticky top-6">
      <h3 className="text-sm mb-1">Bibliotheque</h3>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Glisse un exo dans une seance pour creer un bloc.
      </p>

      {loading ? (
        <p className="text-xs text-[var(--text-muted)]">Chargement...</p>
      ) : exercises.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          Aucun exo. Ajoute-en depuis "Mes exercices".
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {exercises.map((exercise) => (
            <DraggableExercise key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </aside>
  )
}
