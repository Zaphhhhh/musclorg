import { useEffect, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableBlockItem from './SortableBlockItem'
import CopyPicker from './CopyPicker'
import type { SessionWithBlocks } from '../../types/program'
import type { Exercise } from '../../types/exercise'
import type { SessionBlock } from '../../types/program'
import type { SetStrategyType } from '../../types/setStrategy'
import { DAYS_OF_WEEK } from '../../types/program'

interface CopyOption {
  id: string
  label: string
}

interface SessionCardProps {
  session: SessionWithBlocks
  exercisesById: Map<string, Exercise>
  onUpdateBlock: (blockId: string, updates: Partial<SessionBlock>) => void
  onStrategyChange: (blockId: string, strategy: SetStrategyType) => void
  onDeleteBlock: (blockId: string) => void
  onDeleteSession: () => void
  allWeekOptions: CopyOption[]
  allSessionOptions: CopyOption[]
  onCopySessionToWeek: (sessionId: string, targetWeekId: string) => void
  onCopyBlockToSession: (blockId: string, targetSessionId: string) => void
}

export default function SessionCard({
  session,
  exercisesById,
  onUpdateBlock,
  onStrategyChange,
  onDeleteBlock,
  onDeleteSession,
  allWeekOptions,
  allSessionOptions,
  onCopySessionToWeek,
  onCopyBlockToSession,
}: SessionCardProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [copying, setCopying] = useState(false)
  const blockCountRef = useRef(session.session_blocks.length)
  // Empeche un clic parasite (souvent declenche par le drop lui-meme)
  // de re-fermer la seance juste apres l'auto-depliage.
  const justAutoExpandedRef = useRef(false)

  useEffect(() => {
    if (session.session_blocks.length > blockCountRef.current) {
      setCollapsed(false)
      justAutoExpandedRef.current = true
      const timeout = setTimeout(() => {
        justAutoExpandedRef.current = false
      }, 400)
      blockCountRef.current = session.session_blocks.length
      return () => clearTimeout(timeout)
    }
    blockCountRef.current = session.session_blocks.length
  }, [session.session_blocks.length])

  const toggleCollapsed = () => {
    if (justAutoExpandedRef.current) return
    setCollapsed((c) => !c)
  }

  const { setNodeRef, isOver } = useDroppable({
    id: `session-${session.id}`,
    data: { type: 'session', sessionId: session.id },
  })

  const blockIds = session.session_blocks.map((b) => b.id)

  return (
    <div
      ref={setNodeRef}
      className={`bg-[var(--surface)] border rounded-xl p-4 shrink-0 flex flex-col gap-3 transition-[width,background-color] ${
        collapsed ? 'w-[170px]' : 'w-[280px]'
      } ${isOver ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)]'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <button onClick={toggleCollapsed} className="flex items-center gap-1.5 text-left min-w-0">
          <span className="text-[var(--text-muted)] text-xs shrink-0">{collapsed ? '▸' : '▾'}</span>
          <div className="min-w-0">
            <h4 className="text-sm normal-case tracking-normal font-semibold truncate">
              {session.name}
            </h4>
            {session.day_of_week && (
              <span className="text-xs text-[var(--text-muted)]">
                {DAYS_OF_WEEK[session.day_of_week - 1]}
              </span>
            )}
          </div>
        </button>
        {!collapsed && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setCopying((c) => !c)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              Copier
            </button>
            <button onClick={onDeleteSession} className="text-xs text-[var(--danger)]">
              Suppr.
            </button>
          </div>
        )}
      </div>

      {copying && (
        <CopyPicker
          label="Copier cette seance vers..."
          options={allWeekOptions}
          onConfirm={(targetWeekId) => {
            onCopySessionToWeek(session.id, targetWeekId)
            setCopying(false)
          }}
          onCancel={() => setCopying(false)}
        />
      )}

      {collapsed ? (
        <button onClick={toggleCollapsed} className="text-xs text-[var(--text-muted)] text-left">
          {session.session_blocks.length === 0
            ? 'Vide — clique ou depose un exo ici'
            : `${session.session_blocks.length} exo${session.session_blocks.length > 1 ? 's' : ''}`}
        </button>
      ) : (
        <div className="flex flex-col gap-2 min-h-[80px] rounded-lg p-1">
          <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
            {session.session_blocks.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6 border border-dashed border-[var(--border)] rounded-lg">
                Glisse un exo ici
              </p>
            ) : (
              session.session_blocks.map((block) => (
                <SortableBlockItem
                  key={block.id}
                  block={block}
                  exercise={exercisesById.get(block.exercise_id)}
                  onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                  onStrategyChange={(strategy) => onStrategyChange(block.id, strategy)}
                  onDelete={() => onDeleteBlock(block.id)}
                  allSessionOptions={allSessionOptions}
                  onCopyToSession={onCopyBlockToSession}
                />
              ))
            )}
          </SortableContext>
        </div>
      )}
    </div>
  )
}
