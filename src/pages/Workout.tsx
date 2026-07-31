import { Link, useParams } from 'react-router-dom'
import { useSessionDetail } from '../hooks/useSessionDetail'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { computeSets, resolveBaseWeight } from '../lib/computeSets'
import { SET_STRATEGY_LABELS } from '../types/setStrategy'
import { DAYS_OF_WEEK } from '../types/program'
import WorkoutSetTable from '../components/dashboard/WorkoutSetTable'

export default function WorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, loading, error } = useSessionDetail(sessionId)
  const { getLog, updateSetLog } = useWorkoutLog(sessionId)

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text-muted)]">
        Chargement...
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--danger)]">
        {error ?? 'Seance introuvable'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            ← Retour
          </Link>
          <h1 className="text-xl">{session.name}</h1>
          <div />
        </div>
      </header>
      <div className="knurl-divider" />

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
        {session.day_of_week && (
          <p className="text-sm text-[var(--text-muted)] -mt-2">
            {DAYS_OF_WEEK[session.day_of_week - 1]}
          </p>
        )}

        {session.session_blocks.length === 0 ? (
          <p className="text-[var(--text-muted)]">Aucun exercice dans cette seance.</p>
        ) : (
          session.session_blocks.map((block) => {
            const exercisePr = block.exercise?.pr_weight ?? null
            const baseWeight = resolveBaseWeight(block, exercisePr)
            const computedSets = computeSets(block, baseWeight, exercisePr)

            return (
              <div
                key={block.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg normal-case tracking-normal">
                    {block.exercise?.name ?? 'Exercice supprime'}
                  </h2>
                  <span className="text-xs text-[var(--accent)] bg-[var(--accent)]/10 rounded-full px-2 py-0.5">
                    {SET_STRATEGY_LABELS[block.set_strategy]}
                  </span>
                </div>

                {block.rest_seconds && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Repos entre series: {block.rest_seconds}s
                  </p>
                )}

                <WorkoutSetTable
                  sets={computedSets}
                  getLog={(setIndex) => getLog(block.id, setIndex)}
                  onUpdateLog={(setIndex, patch) => updateSetLog(block.id, setIndex, patch)}
                />
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
