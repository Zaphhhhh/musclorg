import type {
  SetStrategyConfig,
  BackOffConfig,
  ClusterConfig,
  DropSetConfig,
  MyoRepsConfig,
  PyramidConfig,
  RestPauseConfig,
} from '../../types/setStrategy'

interface StrategyConfigEditorProps {
  config: SetStrategyConfig
  onChange: (config: SetStrategyConfig) => void
}

function MiniField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="font-mono-num bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-sm w-full focus:border-[var(--accent)] outline-none"
      />
    </label>
  )
}

export default function StrategyConfigEditor({ config, onChange }: StrategyConfigEditorProps) {
  switch (config.type) {
    case 'straight':
    case 'amrap_last_set':
      return null // rien a configurer, sets/reps/poids du bloc suffisent

    case 'pyramid_up':
    case 'pyramid_down': {
      const cfg = config as PyramidConfig
      const updateStep = (i: number, patch: Partial<PyramidConfig['steps'][number]>) => {
        const steps = cfg.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
        onChange({ ...cfg, steps })
      }
      return (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--text-muted)]">Etapes (dans l'ordre d'execution)</p>
          {cfg.steps.map((step, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <MiniField
                label={`Etape ${i + 1} - reps`}
                value={step.reps}
                onChange={(v) => updateStep(i, { reps: v })}
              />
              <MiniField
                label={`Etape ${i + 1} - % du poids`}
                value={step.weight_pct}
                onChange={(v) => updateStep(i, { weight_pct: v })}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...cfg, steps: [...cfg.steps, { reps: 8, weight_pct: 80 }] })}
              className="text-xs text-[var(--accent)]"
            >
              + Etape
            </button>
            {cfg.steps.length > 1 && (
              <button
                type="button"
                onClick={() => onChange({ ...cfg, steps: cfg.steps.slice(0, -1) })}
                className="text-xs text-[var(--danger)]"
              >
                - Etape
              </button>
            )}
          </div>
        </div>
      )
    }

    case 'back_off': {
      const cfg = config as BackOffConfig
      return (
        <div className="grid grid-cols-2 gap-2">
          <MiniField label="Top sets" value={cfg.top_sets} onChange={(v) => onChange({ ...cfg, top_sets: v })} />
          <MiniField label="Reps (top)" value={cfg.top_reps} onChange={(v) => onChange({ ...cfg, top_reps: v })} />
          <MiniField
            label="% poids (top)"
            value={cfg.top_weight_pct}
            onChange={(v) => onChange({ ...cfg, top_weight_pct: v })}
          />
          <MiniField
            label="Series back-off"
            value={cfg.back_off_sets}
            onChange={(v) => onChange({ ...cfg, back_off_sets: v })}
          />
          <MiniField
            label="Reps (back-off)"
            value={cfg.back_off_reps}
            onChange={(v) => onChange({ ...cfg, back_off_reps: v })}
          />
          <MiniField
            label="% poids (back-off)"
            value={cfg.back_off_weight_pct}
            onChange={(v) => onChange({ ...cfg, back_off_weight_pct: v })}
          />
        </div>
      )
    }

    case 'drop_set': {
      const cfg = config as DropSetConfig
      const updateDrop = (i: number, patch: Partial<DropSetConfig['drops'][number]>) => {
        const drops = cfg.drops.map((d, idx) => (idx === i ? { ...d, ...patch } : d))
        onChange({ ...cfg, drops })
      }
      return (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--text-muted)]">Drops successifs</p>
          {cfg.drops.map((drop, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <MiniField
                label={`Drop ${i + 1} - reps`}
                value={drop.reps}
                onChange={(v) => updateDrop(i, { reps: v })}
              />
              <MiniField
                label={`Drop ${i + 1} - % reduction`}
                value={drop.weight_pct_reduction}
                onChange={(v) => updateDrop(i, { weight_pct_reduction: v })}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                onChange({ ...cfg, drops: [...cfg.drops, { reps: 6, weight_pct_reduction: 20 }] })
              }
              className="text-xs text-[var(--accent)]"
            >
              + Drop
            </button>
            {cfg.drops.length > 0 && (
              <button
                type="button"
                onClick={() => onChange({ ...cfg, drops: cfg.drops.slice(0, -1) })}
                className="text-xs text-[var(--danger)]"
              >
                - Drop
              </button>
            )}
          </div>
        </div>
      )
    }

    case 'rest_pause': {
      const cfg = config as RestPauseConfig
      return (
        <div className="grid grid-cols-3 gap-2">
          <MiniField
            label="Reps initiales"
            value={cfg.initial_reps}
            onChange={(v) => onChange({ ...cfg, initial_reps: v })}
          />
          <MiniField
            label="Mini-series"
            value={cfg.mini_sets}
            onChange={(v) => onChange({ ...cfg, mini_sets: v })}
          />
          <MiniField
            label="Pause (s)"
            value={cfg.rest_seconds_between}
            onChange={(v) => onChange({ ...cfg, rest_seconds_between: v })}
          />
        </div>
      )
    }

    case 'cluster': {
      const cfg = config as ClusterConfig
      return (
        <div className="grid grid-cols-3 gap-2">
          <MiniField
            label="Reps / cluster"
            value={cfg.reps_per_cluster}
            onChange={(v) => onChange({ ...cfg, reps_per_cluster: v })}
          />
          <MiniField
            label="Nb clusters"
            value={cfg.clusters}
            onChange={(v) => onChange({ ...cfg, clusters: v })}
          />
          <MiniField
            label="Repos intra (s)"
            value={cfg.intra_set_rest_seconds}
            onChange={(v) => onChange({ ...cfg, intra_set_rest_seconds: v })}
          />
        </div>
      )
    }

    case 'myo_reps': {
      const cfg = config as MyoRepsConfig
      return (
        <div className="grid grid-cols-2 gap-2">
          <MiniField
            label="Reps activation"
            value={cfg.activation_reps}
            onChange={(v) => onChange({ ...cfg, activation_reps: v })}
          />
          <MiniField
            label="Nb mini-series"
            value={cfg.mini_sets_count}
            onChange={(v) => onChange({ ...cfg, mini_sets_count: v })}
          />
          <MiniField
            label="Reps / mini-serie"
            value={cfg.mini_set_reps}
            onChange={(v) => onChange({ ...cfg, mini_set_reps: v })}
          />
          <MiniField
            label="Repos entre mini (s)"
            value={cfg.mini_set_rest_seconds}
            onChange={(v) => onChange({ ...cfg, mini_set_rest_seconds: v })}
          />
        </div>
      )
    }

    default:
      return null
  }
}
