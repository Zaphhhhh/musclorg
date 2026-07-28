import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableBlockItem from './SortableBlockItem'
import type { SessionWithBlocks } from '../../types/program'
import type { Exercise } from '../../types/exercise'
import type { SessionBlock } from '../../types/program'
import type { SetStrategyType } from '../../types/setStrategy'
import { DAYS_OF_WEEK } from '../../types/program'

interface SessionCardProps {
  session: SessionWithBlocks
  exercisesById: Map<string, Exercise>
  onUpdateBlock: (blockId: string, updates: Partial<SessionBlock>) => void
  onStrategyChange: (blockId: string, strategy: SetStrategyType) => void
  onDeleteBlock: (blockId: string) => void
  onDeleteSession: () => void
}

export default function SessionCard({
  session,
  exercisesById,
  onUpdateBlock,
  onStrategyChange,
  onDeleteBlock,
  onDeleteSession,
}: SessionCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `session-${session.id}`,
    data: { type: 'session', sessionId: session.id },
  })

  const blockIds = session.session_blocks.map((b) => b.id)

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 min-w-[280px] w-[280px] shrink-0 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm normal-case tracking-normal font-semibold">{session.name}</h4>
          {session.day_of_week && (
            <span className="text-xs text-[var(--text-muted)]">
              {DAYS_OF_WEEK[session.day_of_week - 1]}
            </span>
          )}
        </div>
        <button onClick={onDeleteSession} className="text-xs text-[var(--danger)]">
          Suppr.
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[80px] rounded-lg p-1 transition-colors ${
          isOver ? 'bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/40' : ''
        }`}
      >
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
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
