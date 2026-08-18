import type { JournalEntry } from '../../hooks/useWorkoutHistory'
import { TrashIcon } from '../ui/icons'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}min${s > 0 ? String(s).padStart(2, '0') : ''}` : `${s}s`
}

interface SessionJournalProps {
  entries: JournalEntry[]
  onDelete: (id: string) => void
}

export default function SessionJournal({ entries, onDelete }: SessionJournalProps) {
  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
        <p className="text-[var(--text-muted)]">
          Aucune seance loggee pour l'instant. Termine une seance en mode entrainement pour la
          voir apparaitre ici.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry) => {
        const hasRatings =
          entry.intensity_rating != null ||
          entry.duration_rating != null ||
          entry.relevance_rating != null

        // Regroupe les series consecutives du meme exo (deja triees par
        // ordre du bloc puis numero de serie) pour un affichage clair,
        // avec TOUTES les series — pas seulement celles qui ont devie du
        // prevu.
        const groups: { exerciseName: string; sets: typeof entry.sets }[] = []
        for (const s of entry.sets) {
          const last = groups[groups.length - 1]
          if (last && last.exerciseName === s.exercise_name) last.sets.push(s)
          else groups.push({ exerciseName: s.exercise_name, sets: [s] })
        }

        return (
          <div
            key={entry.id}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base normal-case tracking-normal font-semibold">
                {entry.session_name}
              </h3>
              <div className="flex items-center gap-3">
                {entry.duration_seconds != null && (
                  <span className="text-xs text-[var(--text-muted)] font-mono-num">
                    {formatDuration(entry.duration_seconds)}
                  </span>
                )}
                <span className="text-xs text-[var(--text-muted)] font-mono-num capitalize">
                  {formatDate(entry.performed_on)}
                </span>
                <button
                  onClick={() => {
                    if (confirm('Supprimer cette seance loggee ? Cette action est irreversible.')) {
                      onDelete(entry.id)
                    }
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                  aria-label="Supprimer cette seance loggee"
                  title="Supprimer cette seance loggee"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {hasRatings && (
              <div className="flex gap-4 text-xs">
                {entry.intensity_rating != null && (
                  <span className="text-[var(--text-muted)]">
                    Intensite:{' '}
                    <span className="font-mono-num text-[var(--pr)]">
                      {entry.intensity_rating}/10
                    </span>
                  </span>
                )}
                {entry.duration_rating != null && (
                  <span className="text-[var(--text-muted)]">
                    Duree:{' '}
                    <span className="font-mono-num text-[var(--pr)]">
                      {entry.duration_rating}/10
                    </span>
                  </span>
                )}
                {entry.relevance_rating != null && (
                  <span className="text-[var(--text-muted)]">
                    Pertinence:{' '}
                    <span className="font-mono-num text-[var(--pr)]">
                      {entry.relevance_rating}/10
                    </span>
                  </span>
                )}
              </div>
            )}

            {groups.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Detail des series
                </p>
                {groups.map((g, gi) => (
                  <div key={gi} className="flex flex-col gap-1">
                    <p className="text-sm font-semibold normal-case tracking-normal">
                      {g.exerciseName}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {g.sets.map((s, si) => {
                        const deviated =
                          (s.actual_reps != null &&
                            s.planned_reps != null &&
                            s.actual_reps !== s.planned_reps) ||
                          (s.actual_weight != null &&
                            s.planned_weight != null &&
                            s.actual_weight !== s.planned_weight)

                        return (
                          <li key={si} className="text-sm">
                            <span
                              className={`font-mono-num ${
                                deviated ? 'text-[var(--pr)]' : 'text-[var(--text)]'
                              }`}
                            >
                              Serie {s.set_index + 1}: {s.actual_reps ?? '?'} reps @{' '}
                              {s.actual_weight ?? '?'}kg
                            </span>
                            {deviated && (
                              <span className="text-xs text-[var(--text-muted)] ml-1">
                                (prevu: {s.planned_reps ?? '?'} reps @ {s.planned_weight ?? '?'}kg)
                              </span>
                            )}
                            {s.comment && (
                              <p className="text-xs text-[var(--pr)] italic">"{s.comment}"</p>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              !hasRatings && (
                <p className="text-xs text-[var(--text-muted)]">
                  Rien de particulier a signaler pour cette seance.
                </p>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
