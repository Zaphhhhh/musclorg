import { useState } from 'react'
import SessionCard from './SessionCard'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { DAYS_OF_WEEK } from '../../types/program'
import type { WeekWithSessions, SessionBlock } from '../../types/program'
import type { Exercise } from '../../types/exercise'
import type { SetStrategyType } from '../../types/setStrategy'

interface CopyOption {
  id: string
  label: string
}

interface WeekBlockProps {
  week: WeekWithSessions
  exercisesById: Map<string, Exercise>
  onAddSession: (name: string, dayOfWeek: number | null) => void
  onDeleteWeek: () => void
  onUpdateBlock: (blockId: string, updates: Partial<SessionBlock>) => void
  onStrategyChange: (blockId: string, strategy: SetStrategyType) => void
  onDeleteBlock: (blockId: string) => void
  onDeleteSession: (sessionId: string) => void
  allWeekOptions: CopyOption[]
  allSessionOptions: CopyOption[]
  onCopySessionToWeek: (sessionId: string, targetWeekId: string) => void
  onCopyBlockToSession: (blockId: string, targetSessionId: string) => void
}

export default function WeekBlock({
  week,
  exercisesById,
  onAddSession,
  onDeleteWeek,
  onUpdateBlock,
  onStrategyChange,
  onDeleteBlock,
  onDeleteSession,
  allWeekOptions,
  allSessionOptions,
  onCopySessionToWeek,
  onCopyBlockToSession,
}: WeekBlockProps) {
  const [addingSession, setAddingSession] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [day, setDay] = useState<string>(DAYS_OF_WEEK[0])

  const handleAdd = () => {
    if (!sessionName.trim()) return
    onAddSession(sessionName, DAYS_OF_WEEK.indexOf(day as (typeof DAYS_OF_WEEK)[number]) + 1)
    setSessionName('')
    setAddingSession(false)
  }

  return (
    <div className="border-l-2 border-[var(--border)] pl-4">
      <div className="flex items-center gap-2 mb-3">
        <h5 className="text-sm text-[var(--text-muted)]">Semaine {week.week_number}</h5>
        {week.is_deload && (
          <span className="text-xs text-[var(--pr)] bg-[var(--pr)]/10 rounded-full px-2 py-0.5">
            Deload
          </span>
        )}
        <button onClick={onDeleteWeek} className="text-xs text-[var(--danger)] ml-auto">
          Supprimer la semaine
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {week.sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            exercisesById={exercisesById}
            onUpdateBlock={onUpdateBlock}
            onStrategyChange={onStrategyChange}
            onDeleteBlock={onDeleteBlock}
            onDeleteSession={() => onDeleteSession(session.id)}
            allWeekOptions={allWeekOptions}
            allSessionOptions={allSessionOptions}
            onCopySessionToWeek={onCopySessionToWeek}
            onCopyBlockToSession={onCopyBlockToSession}
          />
        ))}

        <div className="w-[220px] shrink-0">
          {addingSession ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 flex flex-col gap-2">
              <Input
                label="Nom"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ex: Push"
                className="py-1.5 text-sm"
              />
              <Select
                label="Jour"
                options={DAYS_OF_WEEK}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="py-1.5 text-sm"
              />
              <div className="flex gap-2 mt-1">
                <Button onClick={handleAdd} className="text-xs px-3 py-1.5">
                  Ajouter
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setAddingSession(false)}
                  className="text-xs px-3 py-1.5"
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingSession(true)}
              className="w-full h-full min-h-[100px] border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
            >
              + Seance
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
