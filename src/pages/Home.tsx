import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePrograms } from '../hooks/usePrograms'
import { useProgramDetail } from '../hooks/useProgramDetail'
import { useExercises } from '../hooks/useExercises'
import { useLastPerformedSession } from '../hooks/useLastPerformedSession'
import { useProfile } from '../hooks/useProfile'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Logo from '../components/ui/Logo'
import WeekOverview from '../components/dashboard/WeekOverview'
import MuscleVolumeCard from '../components/dashboard/MuscleVolumeCard'
import { PixelUserIcon } from '../components/ui/icons'
import { PERIODIZATION_LABELS } from '../types/program'

const SELECTED_PROGRAM_KEY = 'musclorg_selected_program_id'

export default function HomePage() {
  const { session, signOut } = useAuth()
  const { profile } = useProfile()
  const email = session?.user.email ?? ''
  const displayName = profile?.display_name?.trim() || email.split('@')[0]

  const { programs, loading: programsLoading } = usePrograms()

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(() =>
    localStorage.getItem(SELECTED_PROGRAM_KEY)
  )
  const selectedProgram =
    programs.find((p) => p.id === selectedProgramId) ?? programs[0]

  useEffect(() => {
    if (selectedProgram) localStorage.setItem(SELECTED_PROGRAM_KEY, selectedProgram.id)
  }, [selectedProgram?.id])

  const { program, loading: programDetailLoading } = useProgramDetail(selectedProgram?.id)
  const { exercises } = useExercises()
  const exercisesById = new Map(exercises.map((e) => [e.id, e]))

  // Toutes les semaines du programme, dans l'ordre (phase 1/semaine 1,
  // phase 1/semaine 2, ..., phase 2/semaine 1, ...). Memorise pour ne
  // pas changer de reference a chaque render (utilise dans un effect).
  const allWeeks = useMemo(
    () =>
      program?.phases.flatMap((phase, phaseIndex) =>
        phase.weeks.map((week) => ({ phase, phaseNumber: phaseIndex + 1, week }))
      ) ?? [],
    [program]
  )

  const allSessionIds = useMemo(
    () => allWeeks.flatMap(({ week }) => week.sessions.map((s) => s.id)),
    [allWeeks]
  )
  const { sessionId: lastSessionId, loading: lastSessionLoading } =
    useLastPerformedSession(allSessionIds)

  const [weekIndex, setWeekIndex] = useState(0)

  // Repart de la premiere semaine quand on change de programme
  useEffect(() => {
    setWeekIndex(0)
  }, [selectedProgram?.id])

  // Une fois qu'on sait sur quelle seance des perfs ont ete loggees en
  // dernier, on ouvre directement la semaine qui la contient plutot que
  // de rester bloque sur la semaine 1.
  useEffect(() => {
    if (!lastSessionId || allWeeks.length === 0) return
    const idx = allWeeks.findIndex(({ week }) => week.sessions.some((s) => s.id === lastSessionId))
    if (idx !== -1) setWeekIndex(idx)
  }, [lastSessionId, allWeeks])

  const clampedIndex = Math.min(weekIndex, Math.max(allWeeks.length - 1, 0))
  const current = allWeeks[clampedIndex]
  const weekSessions = current?.week.sessions ?? []
  const totalSets = weekSessions
    .flatMap((s) => s.session_blocks)
    .reduce((sum, b) => sum + b.sets, 0)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Button
                variant="ghost"
                className="p-2"
                aria-label="Mon profil"
                title="Mon profil"
              >
                <PixelUserIcon className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" onClick={() => signOut()}>
              Se deconnecter
            </Button>
          </div>
        </div>
      </header>

      <div className="knurl-divider" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-2xl mb-1">Salut, {displayName}</h2>
        <p className="text-[var(--text-muted)] mb-10">Voici un apercu de ta semaine.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Series cette semaine" value={String(totalSets)} />
          <StatCard label="Seances programmees" value={String(weekSessions.length)} />
          <StatCard
            label="Phase actuelle"
            value={current ? PERIODIZATION_LABELS[current.phase.periodization_type] : '—'}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
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

        {programs.length > 1 && (
          <div className="mt-8 max-w-xs">
            <Select
              label="Programme affiche"
              options={programs.map((p) => p.name)}
              value={selectedProgram?.name ?? ''}
              onChange={(e) => {
                const p = programs.find((prog) => prog.name === e.target.value)
                if (p) setSelectedProgramId(p.id)
              }}
            />
          </div>
        )}

        {programsLoading || programDetailLoading || lastSessionLoading ? (
          <p className="text-[var(--text-muted)] mt-12">Chargement...</p>
        ) : !selectedProgram ? (
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
              "{selectedProgram.name}" n'a pas encore de semaines configurees.{' '}
              <Link
                to={`/programs/${selectedProgram.id}`}
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
                <p className="text-sm text-[var(--text-muted)]">
                  M{current.phaseNumber} — {current.phase.name}
                </p>
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
              programName={selectedProgram.name}
              programId={selectedProgram.id}
              sessions={weekSessions}
              exercisesById={exercisesById}
            />

            <div className="mt-6">
              <MuscleVolumeCard sessions={weekSessions} exercisesById={exercisesById} />
            </div>
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
