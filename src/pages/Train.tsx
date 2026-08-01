import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSessionDetail } from '../hooks/useSessionDetail'
import { useWorkoutLog } from '../hooks/useWorkoutLog'
import { computeSets, resolveBaseWeight } from '../lib/computeSets'
import Button from '../components/ui/Button'

interface FlatSet {
  blockIndex: number
  blockId: string
  exerciseName: string
  setIdx: number
  restSeconds: number
  label: string
  reps: number | 'AMRAP'
  weight: number | null
}

const MIN_REST = 60 // 1 min
const MAX_REST = 600 // 10 min
const REST_STEP = 30

function formatTime(totalSeconds: number) {
  const abs = Math.abs(totalSeconds)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${totalSeconds < 0 ? '-' : ''}${m}:${String(s).padStart(2, '0')}`
}

export default function TrainPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, loading, error } = useSessionDetail(sessionId)
  const { updateSetLog } = useWorkoutLog(sessionId)

  const [phase, setPhase] = useState<'loading' | 'config' | 'set' | 'rest' | 'done'>('loading')
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(90)

  // Certains exos peuvent ne pas avoir de temps de repos defini dans le
  // programme -> on demande une valeur par defaut avant de commencer,
  // seulement si au moins un bloc en a besoin.
  const needsRestConfig = useMemo(
    () => session?.session_blocks.some((b) => b.rest_seconds == null) ?? false,
    [session]
  )

  useEffect(() => {
    if (!session) return
    setPhase(needsRestConfig ? 'config' : 'set')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const flatSets: FlatSet[] = useMemo(() => {
    if (!session) return []
    return session.session_blocks.flatMap((block, blockIndex) => {
      const exercisePr = block.exercise?.pr_weight ?? null
      const baseWeight = resolveBaseWeight(block, exercisePr)
      const computed = computeSets(block, baseWeight, exercisePr)
      return computed.map((cs, setIdx) => ({
        blockIndex,
        blockId: block.id,
        exerciseName: block.exercise?.name ?? 'Exercice',
        setIdx,
        restSeconds: block.rest_seconds ?? defaultRestSeconds,
        label: cs.label,
        reps: cs.reps,
        weight: cs.weight,
      }))
    })
  }, [session, defaultRestSeconds])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [actualReps, setActualReps] = useState<string>('')
  const [actualWeight, setActualWeight] = useState<string>('')
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null)
  const [, setTick] = useState(0)

  const current = flatSets[currentIndex]
  const next = flatSets[currentIndex + 1]

  // Pre-remplit reps/poids avec le prevu a chaque nouvelle serie
  useEffect(() => {
    if (!current) return
    setActualReps(current.reps === 'AMRAP' ? '' : String(current.reps))
    setActualWeight(current.weight != null ? String(current.weight) : '')
  }, [current])

  // Chrono de repos: tick chaque seconde pendant la phase 'rest'
  useEffect(() => {
    if (phase !== 'rest') return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  if (loading || phase === 'loading') {
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

  if (flatSets.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4 text-[var(--text-muted)] px-6 text-center">
        <p>Aucun exercice configure dans cette seance.</p>
        <Link to="/">
          <Button variant="secondary">◂ Retour</Button>
        </Link>
      </div>
    )
  }

  const validateSet = () => {
    if (!current) return

    updateSetLog(current.blockId, current.setIdx, {
      completed: true,
      actual_reps: actualReps === '' ? null : Number(actualReps),
      actual_weight: actualWeight === '' ? null : Number(actualWeight),
    })

    if (currentIndex >= flatSets.length - 1) {
      setPhase('done')
      return
    }

    setRestStartedAt(Date.now())
    setPhase('rest')
  }

  const goToNextSet = () => {
    setCurrentIndex((i) => i + 1)
    setPhase('set')
    setRestStartedAt(null)
  }

  // --- Ecran config du temps de repos par defaut ---
  if (phase === 'config') {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-8 px-6 text-center">
        <Link to="/" className="self-start absolute top-4 left-4">
          <Button variant="secondary" className="p-2" aria-label="Retour" title="Retour">
            ◂
          </Button>
        </Link>

        <p className="text-[var(--text-muted)] uppercase tracking-wide text-sm">
          Temps de repos par defaut
        </p>
        <p className="text-[var(--text-muted)] text-sm max-w-xs">
          Certains exos de cette seance n'ont pas de repos defini dans le programme. Choisis une
          valeur par defaut (1 a 10 min).
        </p>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setDefaultRestSeconds((s) => Math.max(MIN_REST, s - REST_STEP))}
            disabled={defaultRestSeconds <= MIN_REST}
            className="text-3xl w-14 h-14 border-2 border-[var(--border)] text-[var(--text)] disabled:opacity-30 hover:border-[var(--pr)]"
          >
            −
          </button>
          <p className="font-mono-num text-6xl w-40 text-center">
            {formatTime(defaultRestSeconds)}
          </p>
          <button
            onClick={() => setDefaultRestSeconds((s) => Math.min(MAX_REST, s + REST_STEP))}
            disabled={defaultRestSeconds >= MAX_REST}
            className="text-3xl w-14 h-14 border-2 border-[var(--border)] text-[var(--text)] disabled:opacity-30 hover:border-[var(--pr)]"
          >
            +
          </button>
        </div>

        <Button onClick={() => setPhase('set')} className="text-base px-8 py-4">
          Commencer l'entrainement
        </Button>
      </div>
    )
  }

  // --- Ecran fin de seance ---
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl">Seance terminee !</h1>
        <p className="text-[var(--text-muted)]">Bien joue, {session.name} est dans la poche.</p>
        <Link to="/">
          <Button>Retour a l'accueil</Button>
        </Link>
      </div>
    )
  }

  // --- Ecran repos ---
  if (phase === 'rest' && current) {
    const elapsed = restStartedAt ? Math.floor((Date.now() - restStartedAt) / 1000) : 0
    const remaining = current.restSeconds - elapsed
    const overtime = remaining < 0

    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-8 px-6">
        <p className="text-[var(--text-muted)] uppercase tracking-wide text-sm">Repos</p>
        <p
          className="font-mono-num text-6xl"
          style={{ color: overtime ? 'var(--danger)' : 'var(--text)' }}
        >
          {formatTime(remaining)}
        </p>
        {overtime && <p className="text-[var(--danger)] text-sm">Temps de repos depasse</p>}

        {next && (
          <p className="text-[var(--text-muted)] text-sm text-center">
            Ensuite: {next.exerciseName} — {next.label} · {next.reps} reps
            {next.weight != null ? ` · ${next.weight}kg` : ''}
          </p>
        )}

        <Button onClick={goToNextSet}>Serie suivante</Button>
        <Link to="/">
          <Button variant="ghost" className="text-xs">
            ◂ Quitter le mode entrainement
          </Button>
        </Link>
      </div>
    )
  }

  // --- Ecran serie en cours ---
  if (!current) return null

  const setsRemainingInExercise = flatSets.filter(
    (s, i) => s.blockIndex === current.blockIndex && i >= currentIndex
  ).length
  const remainingBlockIndexes = new Set(
    flatSets
      .filter((s, i) => i > currentIndex && s.blockIndex > current.blockIndex)
      .map((s) => s.blockIndex)
  )
  const exercisesRemainingAfter = remainingBlockIndexes.size

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="secondary" className="p-2" aria-label="Quitter" title="Quitter">
              ◂
            </Button>
          </Link>
          <p className="text-sm text-[var(--text-muted)]">{session.name}</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-10">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
          {setsRemainingInExercise} serie{setsRemainingInExercise > 1 ? 's' : ''} restante
          {setsRemainingInExercise > 1 ? 's' : ''} sur cet exo · {exercisesRemainingAfter} exo
          {exercisesRemainingAfter > 1 ? 's' : ''} restant{exercisesRemainingAfter > 1 ? 's' : ''}{' '}
          apres
        </p>

        <h1 className="text-2xl text-center">{current.exerciseName}</h1>
        <p className="text-[var(--pr)]">{current.label}</p>

        <div className="flex gap-4 items-end">
          <div className="flex flex-col items-center gap-1">
            <label className="text-xs text-[var(--text-muted)] uppercase">Reps</label>
            <input
              type="number"
              value={actualReps}
              placeholder={current.reps === 'AMRAP' ? 'max' : String(current.reps)}
              onChange={(e) => setActualReps(e.target.value)}
              className="font-mono-num text-4xl text-center w-28 bg-[var(--surface-2)] border-2 border-[var(--border)] px-2 py-2 focus:border-[var(--pr)] outline-none"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <label className="text-xs text-[var(--text-muted)] uppercase">Poids (kg)</label>
            <input
              type="number"
              step={0.5}
              value={actualWeight}
              onChange={(e) => setActualWeight(e.target.value)}
              className="font-mono-num text-4xl text-center w-28 bg-[var(--surface-2)] border-2 border-[var(--border)] px-2 py-2 focus:border-[var(--pr)] outline-none"
            />
          </div>
        </div>

        {next && (
          <p className="text-[var(--text-muted)] text-sm text-center">
            Prochaine: {next.blockIndex === current.blockIndex ? '' : `${next.exerciseName} — `}
            {next.label} · {next.reps} reps
            {next.weight != null ? ` · ${next.weight}kg` : ''}
          </p>
        )}

        <Button onClick={validateSet} className="text-base px-8 py-4">
          Valider la serie
        </Button>
      </main>
    </div>
  )
}
