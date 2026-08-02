import type { SessionWithBlocks } from '../../types/program'
import type { Exercise } from '../../types/exercise'

interface MuscleVolumeCardProps {
  sessions: SessionWithBlocks[]
  exercisesById: Map<string, Exercise>
}

export default function MuscleVolumeCard({ sessions, exercisesById }: MuscleVolumeCardProps) {
  const volume = new Map<string, number>()

  for (const session of sessions) {
    for (const block of session.session_blocks) {
      const exercise = exercisesById.get(block.exercise_id)
      if (!exercise) continue

      if (exercise.primary_muscle_group) {
        volume.set(
          exercise.primary_muscle_group,
          (volume.get(exercise.primary_muscle_group) ?? 0) + block.sets
        )
      }
      for (const secondary of exercise.secondary_muscle_groups) {
        volume.set(secondary, (volume.get(secondary) ?? 0) + block.sets * 0.5)
      }
    }
  }

  const rows = Array.from(volume.entries()).sort((a, b) => b[1] - a[1])
  const max = rows[0]?.[1] ?? 1

  if (rows.length === 0) return null

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Volume par groupe musculaire cette semaine
      </p>
      <div className="flex flex-col gap-2.5">
        {rows.map(([muscle, value]) => (
          <div key={muscle} className="flex items-center gap-3">
            <span className="text-sm w-28 shrink-0 truncate">{muscle}</span>
            <div className="flex-1 h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)]"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <span className="font-mono-num text-sm w-10 text-right shrink-0">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">
        Principal = 1 serie, secondaire = 0.5 serie.
      </p>
    </div>
  )
}
