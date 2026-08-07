import type { ComputedSet } from '../../lib/computeSets'
import type { SetOverride, SetIntensity } from '../../types/program'

interface SetPreviewProps {
  sets: ComputedSet[]
  overrides: (SetOverride | null)[]
  onOverride: (index: number, override: SetOverride | null) => void
  repsOverrides: (number | null)[]
  onRepsOverride: (index: number, reps: number | null) => void
  intensities: (SetIntensity | null)[]
  onIntensity: (index: number, intensity: SetIntensity | null) => void
}

export default function SetPreview({
  sets,
  overrides,
  onOverride,
  repsOverrides,
  onRepsOverride,
  intensities,
  onIntensity,
}: SetPreviewProps) {
  if (sets.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">Aucune serie configuree.</p>
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
        const repsOverride = repsOverrides[i] ?? null
        const intensity = intensities[i] ?? null

        return (
          <div
            key={i}
            className={`flex flex-col gap-1.5 rounded px-2 py-1.5 ${
              set.overridden || set.repsOverridden
                ? 'bg-[var(--pr)]/10 ring-1 ring-[var(--pr)]/40'
                : 'bg-[var(--surface)]'
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
              <input
                type="number"
                value={repsOverride ?? (set.reps === 'AMRAP' ? '' : set.reps)}
                placeholder={String(set.reps)}
                onChange={(e) =>
                  onRepsOverride(i, e.target.value === '' ? null : Number(e.target.value))
                }
                className="w-12 text-right bg-transparent border border-[var(--border)] rounded px-1 py-0.5 focus:border-[var(--accent)] outline-none"
              />
              <span className="text-right w-16">{set.weight != null ? `${set.weight} kg` : '—'}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
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

            <div className="flex items-center gap-1.5">
              {(['none', 'rir', 'rpe'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (t === 'none') onIntensity(i, null)
                    else onIntensity(i, { type: t, value: intensity?.value ?? (t === 'rpe' ? 8 : 2) })
                  }}
                  className={`text-xs px-2 py-0.5 rounded ${
                    (intensity?.type ?? 'none') === t
                      ? 'bg-[var(--pr)] text-[var(--bg)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                  }`}
                >
                  {t === 'none' ? 'Pas de RIR/RPE' : t.toUpperCase()}
                </button>
              ))}
              {intensity && (
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={intensity.value}
                  onChange={(e) => {
                    const value = Math.min(10, Math.max(1, Number(e.target.value)))
                    onIntensity(i, { type: intensity.type, value })
                  }}
                  className="w-14 text-right font-mono-num bg-[var(--surface-2)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs focus:border-[var(--pr)] outline-none"
                />
              )}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-[var(--text-muted)] mt-1">
        "Auto" suit le %PR du bloc. "Fixe" ou "% PR" fige le poids de cette serie precise. Le
        champ reps est toujours modifiable directement. RIR = reps en reserve, RPE = effort
        percu (1-10).
      </p>
    </div>
  )
}
