import Button from '../ui/Button'
import { TrashIcon } from '../ui/icons'
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base normal-case tracking-normal font-semibold">
            {exercise.name}
          </h3>
          {exercise.primary_muscle_group && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs text-[var(--accent)] bg-[var(--accent)]/10 rounded-full px-2 py-0.5">
                {exercise.primary_muscle_group}
              </span>
              {exercise.secondary_muscle_groups.map((group) => (
                <span
                  key={group}
                  className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] rounded-full px-2 py-0.5"
                >
                  {group}
                </span>
              ))}
            </div>
          )}
          {exercise.pr_weight && (
            <span className="inline-block mt-1 text-xs text-[var(--pr)] bg-[var(--pr)]/10 rounded-full px-2 py-0.5">
              Record: {exercise.pr_weight}kg{exercise.pr_reps ? ` x${exercise.pr_reps}` : ''}
            </span>
          )}
        </div>
        <button
          onClick={onEdit}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] shrink-0"
          aria-label="Modifier l'exercice"
        >
          Modifier
        </button>
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
        <Button
          variant="ghost"
          onClick={onDelete}
          className="px-2 py-1.5 text-[var(--danger)]"
          aria-label="Supprimer l'exercice"
          title="Supprimer l'exercice"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
