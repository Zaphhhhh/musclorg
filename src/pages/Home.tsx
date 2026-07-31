import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePrograms } from '../hooks/usePrograms'
import { useProgramDetail } from '../hooks/useProgramDetail'
import { useExercises } from '../hooks/useExercises'
import Button from '../components/ui/Button'
import WeekOverview from '../components/dashboard/WeekOverview'
import { PERIODIZATION_LABELS } from '../types/program'

export default function HomePage() {
  const { session, signOut } = useAuth()
  const email = session?.user.email ?? ''
  const firstName = email.split('@')[0]

  const { programs, loading: programsLoading } = usePrograms()
  const mostRecentProgram = programs[0]
  const { program, loading: programDetailLoading } = useProgramDetail(mostRecentProgram?.id)
  const { exercises } = useExercises()
  const exercisesById = new Map(exercises.map((e) => [e.id, e]))

  // Toutes les semaines du programme, dans l'ordre (phase 1/semaine 1,
  // phase 1/semaine 2, ..., phase 2/semaine 1, ...)
  const allWeeks =
    program?.phases.flatMap((phase) => phase.weeks.map((week) => ({ phase, week }))) ?? []

  const [weekIndex, setWeekIndex] = useState(0)

  // Repart de la premiere semaine quand on change de programme
  useEffect(() => {
    setWeekIndex(0)
  }, [mostRecentProgram?.id])

  const clampedIndex = Math.min(weekIndex, Math.max(allWeeks.length - 1, 0))
  const current = allWeeks[clampedIndex]
  const weekSessions = current?.week.sessions ?? []
  const totalSets = weekSessions
    .flatMap((s) => s.session_blocks)
    .reduce((sum, b) => sum + b.sets, 0)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl">MusclOrg</h1>
          <Button variant="ghost" onClick={() => signOut()}>
            Se deconnecter
          </Button>
        </div>
      </header>

      <div className="knurl-divider" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl mb-1">Salut, {firstName}</h2>
        <p className="text-[var(--text-muted)] mb-10">Voici un apercu de ta semaine.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Series cette semaine" value={String(totalSets)} />
          <StatCard label="Seances programmees" value={String(weekSessions.length)} />
          <StatCard
            label="Phase actuelle"
            value={current ? PERIODIZATION_LABELS[current.phase.periodization_type] : '—'}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <Link to="/exercises">
            <Button variant="secondary">Gerer mes exercices</Button>
          </Link>
          <Link to="/programs">
            <Button variant="secondary">Mes programmes</Button>
          </Link>
          <Link to="/history">
            <Button variant="secondary">Historique</Button>
          </Link>
        </div>

        {programsLoading || programDetailLoading ? (
          <p className="text-[var(--text-muted)] mt-12">Chargement...</p>
        ) : !mostRecentProgram ? (
          <section className="mt-12 border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
            <p className="text-[var(--text-muted)]">
              Aucun programme pour l'instant.{' '}
              <Link to="/programs" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                Cree ton premier programme
              </Link>{' '}
              pour voir tes seances de la semaine ici.
            </p>
          </section>
        ) : allWeeks.length === 0 ? (
          <section className="mt-12 border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
            <p className="text-[var(--text-muted)]">
              "{mostRecentProgram.name}" n'a pas encore de semaines configurees.{' '}
              <Link
                to={`/programs/${mostRecentProgram.id}`}
                className="text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Ouvre-le
              </Link>{' '}
              pour ajouter des phases, semaines et seances.
            </p>
          </section>
        ) : (
          <>
            <div className="flex items-center justify-center gap-4 mt-12 mb-2">
              <button
                onClick={() => setWeekIndex((i) => Math.max(i - 1, 0))}
                disabled={clampedIndex === 0}
                className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed px-2"
                aria-label="Semaine precedente"
              >
                ◂
              </button>
              <div className="text-center">
                <p className="text-sm text-[var(--text-muted)]">{current.phase.name}</p>
                <p className="font-medium">
                  Semaine {current.week.week_number}
                  {current.week.is_deload && (
                    <span className="ml-2 text-xs text-[var(--pr)] bg-[var(--pr)]/10 rounded-full px-2 py-0.5">
                      Deload
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setWeekIndex((i) => Math.min(i + 1, allWeeks.length - 1))}
                disabled={clampedIndex === allWeeks.length - 1}
                className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed px-2"
                aria-label="Semaine suivante"
              >
                ▸
              </button>
            </div>

            <WeekOverview
              programName={mostRecentProgram.name}
              programId={mostRecentProgram.id}
              sessions={weekSessions}
              exercisesById={exercisesById}
            />
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <p className="text-[var(--text-muted)] text-sm mb-2">{label}</p>
      <p className="font-mono-num text-3xl text-[var(--text)]">{value}</p>
    </div>
  )
}
