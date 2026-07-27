import Button from '../ui/Button'
import type { Exercise } from '../../types/exercise'

interface ExerciseCardProps {
  exercise: Exercise
  onEdit: () => void
  onDelete: () => void
}

export default function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
  const hasSuggestion =
    exercise.default_sets || exercise.default_reps || exercise.default_weight

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base normal-case tracking-normal font-semibold">
            {exercise.name}
          </h3>
          {exercise.muscle_group && (
            <span className="inline-block mt-1 text-xs text-[var(--accent)] bg-[var(--accent)]/10 rounded-full px-2 py-0.5">
              {exercise.muscle_group}
            </span>
          )}
        </div>
      </div>

      {hasSuggestion && (
        <div className="font-mono-num text-sm text-[var(--text-muted)] flex flex-wrap gap-3">
          <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]/70 w-full -mb-1">
            Suggestion
          </span>
          {exercise.default_sets && <span>{exercise.default_sets} series</span>}
          {exercise.default_reps && <span>{exercise.default_reps} reps</span>}
          {exercise.default_weight ? <span>{exercise.default_weight} kg</span> : null}
          {exercise.default_rest_seconds && <span>{exercise.default_rest_seconds}s repos</span>}
        </div>
      )}

      {exercise.warmup_enabled && (
        <span className="text-xs text-[var(--pr)]">Echauffement auto active</span>
      )}

      <div className="flex gap-2 mt-1">
        <Button variant="secondary" onClick={onEdit} className="text-xs px-3 py-1.5">
          Modifier
        </Button>
        <Button variant="ghost" onClick={onDelete} className="text-xs px-3 py-1.5 text-[var(--danger)]">
          Supprimer
        </Button>
      </div>
    </div>
  )
}
