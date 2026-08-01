import { Link } from 'react-router-dom'
import { DAYS_OF_WEEK } from '../../types/program'
import type { SessionWithBlocks } from '../../types/program'
import type { Exercise } from '../../types/exercise'

interface WeekOverviewProps {
  programName: string
  programId: string
  sessions: SessionWithBlocks[]
  exercisesById: Map<string, Exercise>
}

export default function WeekOverview({
  programName,
  programId,
  sessions,
  exercisesById,
}: WeekOverviewProps) {
  const sessionsByDay = new Map<number, SessionWithBlocks[]>()
  const noDaySessions: SessionWithBlocks[] = []

  for (const session of sessions) {
    if (session.day_of_week) {
      const list = sessionsByDay.get(session.day_of_week) ?? []
      list.push(session)
      sessionsByDay.set(session.day_of_week, list)
    } else {
      noDaySessions.push(session)
    }
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg">Cette semaine — {programName}</h3>
        <Link
          to={`/programs/${programId}`}
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          Ouvrir le programme →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((dayLabel, i) => {
          const daySessions = sessionsByDay.get(i + 1) ?? []
          return (
            <div
              key={dayLabel}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-2 min-h-[100px]"
            >
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                {dayLabel}
              </p>
              {daySessions.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]/60">Repos</p>
              ) : (
                daySessions.map((session) => (
                  <div key={session.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-1">
                      <Link
                        to={`/workout/${session.id}`}
                        className="text-sm font-semibold normal-case tracking-normal text-[var(--text)] hover:text-[var(--accent)]"
                      >
                        {session.name} →
                      </Link>
                      {session.session_blocks.length > 0 && (
                        <Link
                          to={`/train/${session.id}`}
                          className="text-xs px-1.5 py-0.5 border-2 border-[var(--pr)] text-[var(--pr)] hover:bg-[var(--pr)] hover:text-[var(--bg)] shrink-0"
                          title="Lancer le mode entrainement"
                        >
                          ▶
                        </Link>
                      )}
                    </div>
                    <ul className="flex flex-col gap-0.5">
                      {session.session_blocks.map((block) => (
                        <li key={block.id} className="text-xs text-[var(--text-muted)] truncate">
                          {exercisesById.get(block.exercise_id)?.name ?? 'Exo supprime'}{' '}
                          <span className="font-mono-num">
                            {block.sets}x{block.reps}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>

      {noDaySessions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {noDaySessions.map((session) => (
            <span
              key={session.id}
              className="text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1"
            >
              {session.name} (jour non defini)
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
