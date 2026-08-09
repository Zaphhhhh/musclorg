import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SetPreview from './SetPreview'
import CopyPicker from './CopyPicker'
import { CopyIcon, TrashIcon } from '../ui/icons'
import { computeSets, resolveBaseWeight, maxOverrideWeight } from '../../lib/computeSets'
import type { SessionBlock } from '../../types/program'
import type { SetOverride, SetIntensity } from '../../types/program'
import type { Exercise } from '../../types/exercise'

interface CopyOption {
  id: string
  label: string
}

interface SortableBlockItemProps {
  block: SessionBlock
  exercise: Exercise | undefined
  onUpdate: (updates: Partial<SessionBlock>) => void
  onDelete: () => void
  allSessionOptions: CopyOption[]
  onCopyToSession: (blockId: string, targetSessionId: string) => void
}

export default function SortableBlockItem({
  block,
  exercise,
  onUpdate,
  onDelete,
  allSessionOptions,
  onCopyToSession,
}: SortableBlockItemProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [copying, setCopying] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const exercisePr = exercise?.pr_weight ?? null
  const baseWeight = resolveBaseWeight(block, exercisePr)
  const computedSets = computeSets(block, baseWeight, exercisePr)

  const weightSummary =
    block.weight_mode === 'pct_pr'
      ? `${block.weight_pct ?? 80}% PR${baseWeight != null ? ` (${baseWeight}kg)` : ''}`
      : `${block.weight ?? 0}kg`
  const summary = block.no_sets_mode
    ? block.duration_minutes
      ? `${block.duration_minutes} min`
      : 'Sans series'
    : `${block.sets}x${block.reps} @ ${weightSummary}`

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
            className="touch-none cursor-grab active:cursor-grabbing text-[var(--text-muted)] shrink-0"
            aria-label="Reordonner"
          >
            ⠿
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 min-w-0 text-left"
          >
            <span className="text-[var(--text-muted)] text-xs shrink-0">
              {collapsed ? '▸' : '▾'}
            </span>
            <span className="font-medium truncate">{exercise?.name ?? 'Exercice supprime'}</span>
          </button>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setCopying((c) => !c)}
            className="text-[var(--text-muted)] hover:text-[var(--accent)]"
            aria-label="Copier ce bloc"
            title="Copier ce bloc"
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="text-[var(--text-muted)] hover:text-[var(--danger)]"
            aria-label="Supprimer le bloc"
            title="Supprimer le bloc"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {copying && (
        <CopyPicker
          label="Copier ce bloc vers..."
          options={allSessionOptions}
          onConfirm={(targetSessionId) => {
            onCopyToSession(block.id, targetSessionId)
            setCopying(false)
          }}
          onCancel={() => setCopying(false)}
        />
      )}

      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="text-xs text-[var(--text-muted)] font-mono-num text-left"
        >
          {summary}
        </button>
      ) : (
        <>
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={block.no_sets_mode}
              onChange={(e) => onUpdate({ no_sets_mode: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            Pas de series (cardio, etirements, duree libre...)
          </label>

          {block.no_sets_mode ? (
            <NumField
              label="Duree (minutes)"
              value={block.duration_minutes ?? 0}
              onChange={(v) => onUpdate({ duration_minutes: v })}
            />
          ) : (
            <>
          <div className="grid grid-cols-3 gap-2">
            <NumField label="Series" value={block.sets} onChange={(v) => onUpdate({ sets: v })} />
            <NumField label="Reps" value={block.reps} onChange={(v) => onUpdate({ reps: v })} />
            <NumField
              label="Repos (s)"
              value={block.rest_seconds ?? 180}
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
                    Record: {exercisePr}kg{exercise?.pr_reps ? ` x${exercise.pr_reps}` : ''} →{' '}
                    {baseWeight} kg calcule
                  </p>
                ) : (
                  <p className="text-xs text-[var(--pr)]">
                    Aucun record defini pour cet exo — va le renseigner dans "Mes exercices".
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] pt-2">
            <SetPreview
              sets={computedSets}
              overrides={block.set_overrides ?? []}
              onOverride={(index, override: SetOverride | null) => {
                const current = block.set_overrides ?? []
                const next = [...current]
                while (next.length <= index) next.push(null)
                next[index] = override

                const updates: Partial<SessionBlock> = { set_overrides: next }
                // Si aucun poids general n'est encore renseigne pour ce bloc,
                // on le fixe automatiquement sur le plus lourd des poids par
                // serie deja precises, pour ne pas laisser un "0 kg" affiche.
                if (block.weight_mode === 'fixed' && !block.weight) {
                  const heaviest = maxOverrideWeight(next, exercisePr)
                  if (heaviest != null) updates.weight = heaviest
                }
                onUpdate(updates)
              }}
              repsOverrides={block.set_reps_overrides ?? []}
              onRepsOverride={(index, reps) => {
                const current = block.set_reps_overrides ?? []
                const next = [...current]
                while (next.length <= index) next.push(null)
                next[index] = reps
                onUpdate({ set_reps_overrides: next })
              }}
              intensities={block.set_intensity ?? []}
              onIntensity={(index, intensity: SetIntensity | null) => {
                const current = block.set_intensity ?? []
                const next = [...current]
                while (next.length <= index) next.push(null)
                next[index] = intensity
                onUpdate({ set_intensity: next })
              }}
            />
          </div>
            </>
          )}
        </>
      )}
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
