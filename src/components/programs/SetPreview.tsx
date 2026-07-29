import type { ComputedSet } from '../../lib/computeSets'
import type { SetOverride } from '../../types/program'

interface SetPreviewProps {
  sets: ComputedSet[]
  overrides: (SetOverride | null)[]
  onOverride: (index: number, override: SetOverride | null) => void
}

export default function SetPreview({ sets, overrides, onOverride }: SetPreviewProps) {
  if (sets.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">Configure la strategie pour voir le detail.</p>
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs text-[var(--text-muted)] px-1">
        <span>Serie</span>
        <span>Reps</span>
        <span>Poids</span>
      </div>
      {sets.map((set, i) => {
        const override = overrides[i] ?? null
        const mode = override?.mode ?? 'auto'

        return (
          <div
            key={i}
            className={`flex flex-col gap-1.5 rounded px-2 py-1.5 ${
              set.overridden ? 'bg-[var(--pr)]/10 ring-1 ring-[var(--pr)]/40' : 'bg-[var(--surface)]'
            }`}
          >
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center font-mono-num text-sm">
              <span className="font-sans text-[var(--text)] normal-case tracking-normal">
                {set.label}
                {set.restSeconds != null && (
                  <span className="font-mono-num text-xs text-[var(--text-muted)] ml-1">
                    (+{set.restSeconds}s)
                  </span>
                )}
              </span>
              <span className="text-right w-10">{set.reps}</span>
              <span className="text-right w-16">{set.weight != null ? `${set.weight} kg` : '—'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {(['auto', 'fixed', 'pct_pr'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    if (m === 'auto') onOverride(i, null)
                    else onOverride(i, { mode: m, value: override?.value ?? (m === 'fixed' ? set.weight ?? 0 : 80) })
                  }}
                  className={`text-xs px-2 py-0.5 rounded ${
                    mode === m
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                  }`}
                >
                  {m === 'auto' ? 'Auto' : m === 'fixed' ? 'Fixe' : '% PR'}
                </button>
              ))}

              {mode !== 'auto' && (
                <input
                  type="number"
                  step={mode === 'fixed' ? 0.5 : 5}
                  value={override?.value ?? ''}
                  onChange={(e) =>
                    onOverride(i, { mode: mode as 'fixed' | 'pct_pr', value: Number(e.target.value) })
                  }
                  className="w-16 text-right font-mono-num bg-[var(--surface-2)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs focus:border-[var(--accent)] outline-none"
                />
              )}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-[var(--text-muted)] mt-1">
        "Auto" suit la strategie/le %PR du bloc. "Fixe" ou "% PR" fige cette serie precise.
      </p>
    </div>
  )
}
