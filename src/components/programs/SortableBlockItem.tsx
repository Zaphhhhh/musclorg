import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Select from '../ui/Select'
import StrategyConfigEditor from './StrategyConfigEditor'
import SetPreview from './SetPreview'
import { computeSets, resolveBaseWeight } from '../../lib/computeSets'
import { SET_STRATEGIES, SET_STRATEGY_LABELS } from '../../types/setStrategy'
import type { SetStrategyType } from '../../types/setStrategy'
import type { SessionBlock } from '../../types/program'
import type { SetOverride } from '../../types/program'
import type { Exercise } from '../../types/exercise'

interface SortableBlockItemProps {
  block: SessionBlock
  exercise: Exercise | undefined
  onUpdate: (updates: Partial<SessionBlock>) => void
  onStrategyChange: (strategy: SetStrategyType) => void
  onDelete: () => void
}

export default function SortableBlockItem({
  block,
  exercise,
  onUpdate,
  onStrategyChange,
  onDelete,
}: SortableBlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const exercisePr = exercise?.current_pr ?? null
  const baseWeight = resolveBaseWeight(block, exercisePr)
  const computedSets = computeSets(block, baseWeight, exercisePr)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] shrink-0"
            aria-label="Reordonner"
          >
            ⠿
          </button>
          <span className="font-medium truncate">{exercise?.name ?? 'Exercice supprime'}</span>
        </div>
        <button
          onClick={onDelete}
          className="text-xs text-[var(--danger)] shrink-0"
          aria-label="Supprimer le bloc"
        >
          Supprimer
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumField label="Series" value={block.sets} onChange={(v) => onUpdate({ sets: v })} />
        <NumField label="Reps" value={block.reps} onChange={(v) => onUpdate({ reps: v })} />
        <NumField
          label="Repos (s)"
          value={block.rest_seconds ?? 90}
          onChange={(v) => onUpdate({ rest_seconds: v })}
          step={5}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => onUpdate({ weight_mode: 'fixed' })}
            className={`px-2 py-1 rounded ${
              block.weight_mode === 'fixed'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-muted)]'
            }`}
          >
            Poids fixe
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ weight_mode: 'pct_pr' })}
            className={`px-2 py-1 rounded ${
              block.weight_mode === 'pct_pr'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-muted)]'
            }`}
          >
            % du PR
          </button>
        </div>

        {block.weight_mode === 'fixed' ? (
          <NumField
            label="Poids (kg)"
            value={block.weight ?? 0}
            onChange={(v) => onUpdate({ weight: v })}
            step={0.5}
          />
        ) : (
          <div className="flex flex-col gap-1">
            <NumField
              label="% du PR"
              value={block.weight_pct ?? 80}
              onChange={(v) => onUpdate({ weight_pct: v })}
              step={5}
            />
            {exercisePr ? (
              <p className="text-xs text-[var(--text-muted)]">
                PR: {exercisePr} kg → {baseWeight} kg calcule
              </p>
            ) : (
              <p className="text-xs text-[var(--pr)]">
                Aucun PR defini pour cet exo — va le renseigner dans "Mes exercices".
              </p>
            )}
          </div>
        )}
      </div>

      <Select
        label="Strategie de series"
        options={SET_STRATEGIES.map((s) => SET_STRATEGY_LABELS[s])}
        value={SET_STRATEGY_LABELS[block.set_strategy]}
        onChange={(e) => {
          const strategy = SET_STRATEGIES.find(
            (s) => SET_STRATEGY_LABELS[s] === e.target.value
          )
          if (strategy) onStrategyChange(strategy)
        }}
        className="text-sm py-1.5"
      />

      {block.set_strategy_config && (
        <StrategyConfigEditor
          config={block.set_strategy_config}
          onChange={(config) => onUpdate({ set_strategy_config: config })}
        />
      )}

      <div className="border-t border-[var(--border)] pt-2">
        <SetPreview
          sets={computedSets}
          overrides={block.set_overrides ?? []}
          onOverride={(index, override: SetOverride | null) => {
            const current = block.set_overrides ?? []
            const next = [...current]
            while (next.length <= index) next.push(null)
            next[index] = override
            onUpdate({ set_overrides: next })
          }}
        />
      </div>
    </div>
  )
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--text-muted)]">{label}</label>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="font-mono-num bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-sm w-full focus:border-[var(--accent)] outline-none"
      />
    </div>
  )
}
