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
        const notes = entry.sets.filter((s) => s.comment)
        const variations = entry.sets.filter(
          (s) =>
            (s.actual_reps != null && s.planned_reps != null && s.actual_reps !== s.planned_reps) ||
            (s.actual_weight != null &&
              s.planned_weight != null &&
              s.actual_weight !== s.planned_weight)
        )
        const hasRatings =
          entry.intensity_rating != null ||
          entry.duration_rating != null ||
          entry.relevance_rating != null

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

            {variations.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Ecarts vs prevu
                </p>
                <ul className="flex flex-col gap-0.5">
                  {variations.map((v, i) => (
                    <li key={i} className="text-sm font-mono-num text-[var(--text)]">
                      <span className="font-sans normal-case tracking-normal text-[var(--text-muted)]">
                        {v.exercise_name} (serie {v.set_index + 1}):
                      </span>{' '}
                      {v.actual_reps != null && v.actual_reps !== v.planned_reps && (
                        <span>
                          {v.planned_reps ?? '?'}→{v.actual_reps} reps{' '}
                        </span>
                      )}
                      {v.actual_weight != null && v.actual_weight !== v.planned_weight && (
                        <span>
                          {v.planned_weight ?? '?'}→{v.actual_weight}kg
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {notes.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Notes</p>
                <ul className="flex flex-col gap-0.5">
                  {notes.map((n, i) => (
                    <li key={i} className="text-sm text-[var(--pr)] italic">
                      {n.exercise_name} (serie {n.set_index + 1}): "{n.comment}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!hasRatings && variations.length === 0 && notes.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">
                Rien de particulier a signaler pour cette seance.
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
