import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useExercises } from '../hooks/useExercises'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { useWorkoutHistory } from '../hooks/useWorkoutHistory'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import SessionJournal from '../components/dashboard/SessionJournal'

type Criterion = 'weight' | 'volume'

const CRITERION_LABELS: Record<Criterion, string> = {
  weight: 'Poids seul',
  volume: 'Poids x reps (volume)',
}

export default function HistoryPage() {
  const { exercises, loading: exercisesLoading } = useExercises()
  const [exerciseId, setExerciseId] = useState<string>('')
  const [criterion, setCriterion] = useState<Criterion>('weight')

  const selectedId = exerciseId || exercises[0]?.id
  const { entries, loading, error } = useExerciseHistory(selectedId)
  const {
    entries: journalEntries,
    loading: journalLoading,
    error: journalError,
    deleteEntry,
  } = useWorkoutHistory()

  const chartData = useMemo(() => {
    // Chaque serie loggee devient son propre point, positionne par ordre
    // chronologique (x = index), pas par date brute — sinon plusieurs
    // entrees le meme jour se retrouvaient a la meme position et se
    // melangeaient. La date reste affichee en etiquette/infobulle.
    const occurrenceCount = new Map<string, number>()
    return entries.map((entry, i) => {
      const occurrence = (occurrenceCount.get(entry.date) ?? 0) + 1
      occurrenceCount.set(entry.date, occurrence)
      return {
        x: i,
        date: entry.date,
        occurrence,
        value: criterion === 'weight' ? entry.weight : entry.weight * (entry.reps ?? 0),
      }
    })
  }, [entries, criterion])

  const formatTick = (index: unknown) => {
    const point = chartData[Number(index)]
    if (!point) return ''
    return point.occurrence > 1 ? `${point.date} (#${point.occurrence})` : point.date
  }

  const exerciseNames = exercises.map((e) => e.name)
  const selectedExercise = exercises.find((e) => e.id === selectedId)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="secondary" className="p-2" aria-label="Retour" title="Retour">
              ◂
            </Button>
          </Link>
          <h1 className="text-xl">Historique</h1>
          <div />
        </div>
      </header>
      <div className="knurl-divider" />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {exercisesLoading ? (
          <p className="text-[var(--text-muted)]">Chargement...</p>
        ) : exercises.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
            <p className="text-[var(--text-muted)]">
              Aucun exercice pour l'instant.{' '}
              <Link to="/exercises" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                Ajoutes-en un
              </Link>{' '}
              d'abord.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="w-64">
                <Select
                  label="Exercice"
                  options={exerciseNames}
                  value={selectedExercise?.name ?? exerciseNames[0]}
                  onChange={(e) => {
                    const ex = exercises.find((x) => x.name === e.target.value)
                    if (ex) setExerciseId(ex.id)
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[var(--text-muted)]">Critere</label>
                <div className="flex gap-2">
                  {(['weight', 'volume'] as Criterion[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCriterion(c)}
                      className={`text-sm px-3 py-2 rounded-md ${
                        criterion === c
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'
                      }`}
                    >
                      {CRITERION_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2 mb-6">
                {error}
              </p>
            )}

            {loading ? (
              <p className="text-[var(--text-muted)]">Chargement...</p>
            ) : chartData.length === 0 ? (
              <div className="border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
                <p className="text-[var(--text-muted)]">
                  Pas encore de perf enregistree pour "{selectedExercise?.name}". Remplis tes
                  series reelles depuis une seance pour voir l'evolution ici.
                </p>
              </div>
            ) : (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {selectedExercise?.name} — {CRITERION_LABELS[criterion]}
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2b2e35" />
                      <XAxis
                        dataKey="x"
                        stroke="#8d9099"
                        tick={{ fontSize: 11, fill: '#8d9099' }}
                        tickFormatter={formatTick}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#8d9099" tick={{ fontSize: 12, fill: '#8d9099' }} />
                      <Tooltip
                        labelFormatter={(label) => formatTick(label)}
                        contentStyle={{
                          backgroundColor: '#1a1c21',
                          border: '1px solid #2b2e35',
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                        labelStyle={{ color: '#edebe6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#4c5fff"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#4c5fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        <section className="mt-12">
          <h2 className="text-lg mb-1">Journal des seances</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Ressenti, notes et ecarts par rapport au prevu, seance par seance.
          </p>
          {journalError && (
            <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2 mb-4">
              {journalError}
            </p>
          )}
          {journalLoading ? (
            <p className="text-[var(--text-muted)]">Chargement...</p>
          ) : (
            <SessionJournal entries={journalEntries} onDelete={deleteEntry} />
          )}
        </section>
      </main>
    </div>
  )
}
