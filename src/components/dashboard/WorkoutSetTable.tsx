import type { ComputedSet } from '../../lib/computeSets'
import type { SetLog } from '../../types/workoutLog'

interface WorkoutSetTableProps {
  sets: ComputedSet[]
  getLog: (setIndex: number) => SetLog | null
  onUpdateLog: (
    setIndex: number,
    patch: Partial<Pick<SetLog, 'actual_reps' | 'actual_weight' | 'completed'>>
  ) => void
}

export default function WorkoutSetTable({ sets, getLog, onUpdateLog }: WorkoutSetTableProps) {
  if (sets.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">Aucune serie configuree.</p>
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[1fr_auto_auto_1px_auto_auto_auto] gap-2 text-xs text-[var(--text-muted)] px-1">
        <span>Serie</span>
        <span className="text-right">Reps prevues</span>
        <span className="text-right">Poids prevu</span>
        <span />
        <span className="text-right">Reps faites</span>
        <span className="text-right">Poids fait</span>
        <span></span>
      </div>
      {sets.map((set, i) => {
        const log = getLog(i)
        return (
          <div
            key={i}
            className={`grid grid-cols-[1fr_auto_auto_1px_auto_auto_auto] gap-2 items-center rounded-lg px-3 py-2 ${
              log?.completed ? 'bg-[var(--success)]/10' : 'bg-[var(--surface-2)]'
            }`}
          >
            <span className="text-sm normal-case tracking-normal">
              {set.label}
              {set.restSeconds != null && (
                <span className="text-xs text-[var(--text-muted)] ml-1 font-mono-num">
                  (+{set.restSeconds}s)
                </span>
              )}
              {set.intensity && (
                <span className="text-xs text-[var(--pr)] ml-1 font-mono-num">
                  {set.intensity.type.toUpperCase()} {set.intensity.value}
                </span>
              )}
            </span>
            <span className="font-mono-num text-sm text-right w-14 text-[var(--text-muted)]">
              {set.reps}
            </span>
            <span className="font-mono-num text-sm text-right w-16 text-[var(--text-muted)]">
              {set.weight != null ? `${set.weight}kg` : '—'}
            </span>
            <span className="bg-[var(--border)] h-6 w-px justify-self-center" />
            <input
              type="number"
              placeholder={String(set.reps)}
              value={log?.actual_reps ?? ''}
              onChange={(e) =>
                onUpdateLog(i, {
                  actual_reps: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="font-mono-num text-sm text-right w-14 bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-1 focus:border-[var(--accent)] outline-none"
            />
            <input
              type="number"
              step={0.5}
              placeholder={set.weight != null ? String(set.weight) : '—'}
              value={log?.actual_weight ?? ''}
              onChange={(e) =>
                onUpdateLog(i, {
                  actual_weight: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="font-mono-num text-sm text-right w-16 bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-1 focus:border-[var(--accent)] outline-none"
            />
            <button
              onClick={() => onUpdateLog(i, { completed: !log?.completed })}
              aria-label="Marquer comme fait"
              className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                log?.completed
                  ? 'bg-[var(--success)] border-[var(--success)] text-white'
                  : 'border-[var(--border)] text-[var(--text-muted)]'
              }`}
            >
              ✓
            </button>
          </div>
        )
      })}
    </div>
  )
}
