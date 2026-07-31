import { useState } from 'react'
import WeekBlock from './WeekBlock'
import Button from '../ui/Button'
import { PERIODIZATION_LABELS } from '../../types/program'
import type { PhaseWithWeeks, SessionBlock } from '../../types/program'
import type { Exercise } from '../../types/exercise'
import type { SetStrategyType } from '../../types/setStrategy'

interface CopyOption {
  id: string
  label: string
}

interface PhaseSectionProps {
  phase: PhaseWithWeeks
  exercisesById: Map<string, Exercise>
  onAddWeek: (isDeload: boolean) => void
  onDeletePhase: () => void
  onDeleteWeek: (weekId: string) => void
  onAddSession: (weekId: string, name: string, dayOfWeek: number | null) => void
  onDeleteSession: (sessionId: string) => void
  onUpdateBlock: (blockId: string, updates: Partial<SessionBlock>) => void
  onStrategyChange: (blockId: string, strategy: SetStrategyType) => void
  onDeleteBlock: (blockId: string) => void
  allWeekOptions: CopyOption[]
  allSessionOptions: CopyOption[]
  onCopySessionToWeek: (sessionId: string, targetWeekId: string) => void
  onCopyBlockToSession: (blockId: string, targetSessionId: string) => void
}

export default function PhaseSection({
  phase,
  exercisesById,
  onAddWeek,
  onDeletePhase,
  onDeleteWeek,
  onAddSession,
  onDeleteSession,
  onUpdateBlock,
  onStrategyChange,
  onDeleteBlock,
  allWeekOptions,
  allSessionOptions,
  onCopySessionToWeek,
  onCopyBlockToSession,
}: PhaseSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section className="bg-[var(--surface)]/40 border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-3 text-left"
        >
          <span className="text-[var(--text-muted)] text-sm">{collapsed ? '▸' : '▾'}</span>
          <h3 className="text-lg">{phase.name}</h3>
          <span className="text-xs text-[var(--accent)] bg-[var(--accent)]/10 rounded-full px-2 py-0.5">
            {PERIODIZATION_LABELS[phase.periodization_type]}
          </span>
        </button>
        <div className="flex gap-3 items-center">
          <Button onClick={() => onAddWeek(false)} variant="secondary" className="text-xs px-3 py-1.5">
            + Semaine
          </Button>
          <Button onClick={() => onAddWeek(true)} variant="secondary" className="text-xs px-3 py-1.5">
            + Deload
          </Button>
          <button onClick={onDeletePhase} className="text-xs text-[var(--danger)]">
            Supprimer
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-6">
          {phase.weeks.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Aucune semaine pour l'instant.</p>
          ) : (
            phase.weeks.map((week) => (
              <WeekBlock
                key={week.id}
                week={week}
                exercisesById={exercisesById}
                onAddSession={(name, day) => onAddSession(week.id, name, day)}
                onDeleteWeek={() => onDeleteWeek(week.id)}
                onUpdateBlock={onUpdateBlock}
                onStrategyChange={onStrategyChange}
                onDeleteBlock={onDeleteBlock}
                onDeleteSession={onDeleteSession}
                allWeekOptions={allWeekOptions}
                allSessionOptions={allSessionOptions}
                onCopySessionToWeek={onCopySessionToWeek}
                onCopyBlockToSession={onCopyBlockToSession}
              />
            ))
          )}
        </div>
      )}
    </section>
  )
}
