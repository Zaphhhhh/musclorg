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
  noSetsMode: boolean
  durationMinutes: number | null
}

interface Deviation {
  exerciseName: string
  setLabel: string
  plannedReps: number | 'AMRAP'
  actualReps: number | null
  plannedWeight: number | null
  actualWeight: number | null
}

function describeDeviation(d: Deviation): string {
  const parts: string[] = []
  if (d.actualReps != null && d.plannedReps !== 'AMRAP' && d.actualReps !== d.plannedReps) {
    parts.push(`${d.plannedReps} → ${d.actualReps} reps`)
  }
  if (d.actualWeight != null && d.actualWeight !== d.plannedWeight) {
    parts.push(`${d.plannedWeight ?? '?'} → ${d.actualWeight} kg`)
  }
  return parts.join(', ')
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

function RatingPicker({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      </div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-7 h-7 text-xs font-mono-num border-2 ${
              value === n
                ? 'bg-[var(--pr)] border-[var(--pr)] text-[var(--bg)]'
                : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function SessionClock({ seconds }: { seconds: number }) {
  return (
    <div className="fixed top-3 right-3 z-10 bg-[var(--surface)] border-2 border-[var(--border)] px-2 py-1 font-mono-num text-sm text-[var(--text-muted)]">
      {formatTime(seconds)}
    </div>
  )
}

interface TimelineGroup {
  exerciseName: string
  blockIndex: number
  startIndex: number
  count: number
}

function TrainingTimeline({
  flatSets,
  currentIndex,
}: {
  flatSets: FlatSet[]
  currentIndex: number
}) {
  const groups: TimelineGroup[] = []
  flatSets.forEach((fs, i) => {
    const last = groups[groups.length - 1]
    if (last && last.blockIndex === fs.blockIndex) {
      last.count++
    } else {
      groups.push({ exerciseName: fs.exerciseName, blockIndex: fs.blockIndex, startIndex: i, count: 1 })
    }
  })

  return (
    <div className="w-full flex justify-center overflow-x-auto px-4 py-2">
      <div className="flex gap-3 bg-[var(--surface)] border-2 border-[var(--border)] px-3 py-2 w-max">
        {groups.map((g) => (
          <div key={g.startIndex} className="flex flex-col items-center gap-1 shrink-0">
            <span
              className={`text-[9px] uppercase tracking-wide truncate max-w-[64px] ${
                g.blockIndex === flatSets[currentIndex]?.blockIndex
                  ? 'text-[var(--pr)]'
                  : 'text-[var(--text-muted)]'
              }`}
              title={g.exerciseName}
            >
              {g.exerciseName}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: g.count }, (_, i) => {
                const globalIndex = g.startIndex + i
                const state =
                  globalIndex < currentIndex
                    ? 'done'
                    : globalIndex === currentIndex
                      ? 'current'
                      : 'upcoming'
                return (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 border-2 ${
                      state === 'done'
                        ? 'bg-[var(--success)] border-[var(--success)]'
                        : state === 'current'
                          ? 'bg-[var(--pr)] border-[var(--pr)] animate-pulse'
                          : 'bg-transparent border-[var(--border)]'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TrainPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, programId, loading, error } = useSessionDetail(sessionId)
  const { updateSetLog, saveFeedback, saveDuration, getLog, loading: workoutLogLoading } = useWorkoutLog(sessionId)

  const [deviations, setDeviations] = useState<Deviation[]>([])
  const [intensityRating, setIntensityRating] = useState<number | null>(null)
  const [durationRating, setDurationRating] = useState<number | null>(null)
  const [relevanceRating, setRelevanceRating] = useState<number | null>(null)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)

  const [phase, setPhase] = useState<'loading' | 'config' | 'set' | 'rest' | 'done'>('loading')
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(180)

  // Certains exos peuvent ne pas avoir de temps de repos defini dans le
  // programme -> on demande une valeur par defaut avant de commencer,
  // seulement si au moins un bloc en a besoin.
  const needsRestConfig = useMemo(
    () => session?.session_blocks.some((b) => b.rest_seconds == null) ?? false,
    [session]
  )

  const flatSets: FlatSet[] = useMemo(() => {
    if (!session) return []
    return session.session_blocks.flatMap((block, blockIndex) => {
      const exerciseName = block.exercise?.name ?? 'Exercice'

      // Bloc "sans series" (cardio, duree libre...): une seule etape
      // sans reps/poids, plutot que la liste habituelle de series.
      if (block.no_sets_mode) {
        return [
          {
            blockIndex,
            blockId: block.id,
            exerciseName,
            setIdx: 0,
            restSeconds: block.rest_seconds ?? defaultRestSeconds,
            label: block.duration_minutes ? `${block.duration_minutes} min` : 'Sans series',
            reps: 0,
            weight: null,
            noSetsMode: true,
            durationMinutes: block.duration_minutes,
          },
        ]
      }

      const exercisePr = block.exercise?.pr_weight ?? null
      const baseWeight = resolveBaseWeight(block, exercisePr)
      const computed = computeSets(block, baseWeight, exercisePr)
      return computed.map((cs, setIdx) => ({
        blockIndex,
        blockId: block.id,
        exerciseName,
        setIdx,
        restSeconds: block.rest_seconds ?? defaultRestSeconds,
        label: cs.label,
        reps: cs.reps,
        weight: cs.weight,
        noSetsMode: false,
        durationMinutes: null,
      }))
    })
  }, [session, defaultRestSeconds])

  const [currentIndex, setCurrentIndex] = useState(0)

  // Determine le point de reprise: on regarde jusqu'ou les series sont
  // deja marquees "faites" aujourd'hui (deduit directement des set_logs
  // existants, pas besoin de stocker une position separement). Si tout
  // est deja fait, on va direct sur l'ecran de fin.
  useEffect(() => {
    if (!session || workoutLogLoading || flatSets.length === 0) return

    let resumeIndex = 0
    for (const fs of flatSets) {
      if (getLog(fs.blockId, fs.setIdx)?.completed) resumeIndex++
      else break
    }

    if (resumeIndex >= flatSets.length) {
      setCurrentIndex(flatSets.length - 1)
      setPhase('done')
      return
    }

    setCurrentIndex(resumeIndex)
    setPhase(resumeIndex > 0 ? 'set' : needsRestConfig ? 'config' : 'set')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, workoutLogLoading, flatSets])

  const [actualReps, setActualReps] = useState<string>('')
  const [actualWeight, setActualWeight] = useState<string>('')
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null)
  const [restAccumulated, setRestAccumulated] = useState(0)
  const [restPaused, setRestPaused] = useState(false)
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [, forceTick] = useState(0)

  const current = flatSets[currentIndex]
  const next = flatSets[currentIndex + 1]

  // Pre-remplit reps/poids avec le prevu a chaque nouvelle serie
  useEffect(() => {
    if (!current) return
    setActualReps(current.reps === 'AMRAP' ? '' : String(current.reps))
    setActualWeight(current.weight != null ? String(current.weight) : '')
  }, [current])

  // Pre-remplit le commentaire (s'il y en a deja un) a l'entree dans le
  // repos qui suit la validation d'une serie.
  useEffect(() => {
    if (phase !== 'rest' || !current) return
    setCommentDraft(getLog(current.blockId, current.setIdx)?.comment ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current])

  // Chronos ancres sur de vraies horodatages (Date.now()), pas sur un
  // compteur de ticks: setInterval se met en pause/derive quand le
  // telephone verrouille l'ecran, mais l'ecart avec l'heure reelle,
  // lui, reste toujours exact des qu'on recalcule.
  const restElapsed =
    restPaused || !restStartedAt
      ? restAccumulated
      : restAccumulated + Math.floor((Date.now() - restStartedAt) / 1000)

  const sessionElapsed = sessionStartedAt ? Math.floor((Date.now() - sessionStartedAt) / 1000) : 0

  // Demarre le chrono de seance une seule fois, a la premiere entree
  // dans le vif du sujet (pas pendant l'ecran de config).
  useEffect(() => {
    if ((phase === 'set' || phase === 'rest') && sessionStartedAt == null) {
      setSessionStartedAt(Date.now())
    }
  }, [phase, sessionStartedAt])

  // Force un re-render chaque seconde pour rafraichir l'affichage des
  // chronos ci-dessus (le calcul reste base sur Date.now(), ce tick ne
  // sert qu'a redessiner l'ecran).
  useEffect(() => {
    if (phase !== 'set' && phase !== 'rest') return
    const interval = setInterval(() => forceTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Recalcule immediatement au retour au premier plan (ecran reveille,
  // onglet repasse au premier plan) au lieu d'attendre le prochain tick.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') forceTick((t) => t + 1)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const togglePause = () => {
    if (restPaused) {
      setRestStartedAt(Date.now())
      setRestPaused(false)
    } else {
      setRestAccumulated(restElapsed)
      setRestPaused(true)
    }
  }

  if (loading || workoutLogLoading || phase === 'loading') {
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

    if (current.noSetsMode) {
      updateSetLog(current.blockId, current.setIdx, { completed: true })

      if (currentIndex >= flatSets.length - 1) {
        saveDuration(sessionElapsed)
        setPhase('done')
        return
      }

      setRestAccumulated(0)
      setRestStartedAt(Date.now())
      setRestPaused(false)
      setPhase('rest')
      return
    }

    const parsedActualReps = actualReps === '' ? null : Number(actualReps)
    const parsedActualWeight = actualWeight === '' ? null : Number(actualWeight)

    updateSetLog(current.blockId, current.setIdx, {
      completed: true,
      actual_reps: parsedActualReps,
      actual_weight: parsedActualWeight,
    })

    const repsChanged =
      current.reps !== 'AMRAP' && parsedActualReps != null && parsedActualReps !== current.reps
    const weightChanged = parsedActualWeight != null && parsedActualWeight !== current.weight

    if (repsChanged || weightChanged) {
      setDeviations((prev) => [
        ...prev,
        {
          exerciseName: current.exerciseName,
          setLabel: current.label,
          plannedReps: current.reps,
          actualReps: parsedActualReps,
          plannedWeight: current.weight,
          actualWeight: parsedActualWeight,
        },
      ])
    }

    if (currentIndex >= flatSets.length - 1) {
      saveDuration(sessionElapsed)
      setPhase('done')
      return
    }

    setRestAccumulated(0)
    setRestStartedAt(Date.now())
    setRestPaused(false)
    setPhase('rest')
  }

  const goToNextSet = () => {
    setCurrentIndex((i) => i + 1)
    setPhase('set')
    setRestAccumulated(0)
    setRestStartedAt(null)
    setRestPaused(false)
  }

  const goToPreviousSet = () => {
    if (currentIndex === 0) return
    setCurrentIndex((i) => i - 1)
    setPhase('set')
    setRestAccumulated(0)
    setRestStartedAt(null)
    setRestPaused(false)
  }

  const submitFeedback = async () => {
    if (intensityRating == null || durationRating == null || relevanceRating == null) return
    setFeedbackSubmitting(true)
    await saveFeedback({
      intensity_rating: intensityRating,
      duration_rating: durationRating,
      relevance_rating: relevanceRating,
    })
    setFeedbackSubmitting(false)
    setFeedbackSubmitted(true)
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
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <h1 className="text-2xl">Seance terminee !</h1>
        <p className="text-[var(--text-muted)]">
          Bien joue, {session.name} est dans la poche en {formatTime(sessionElapsed)}.
        </p>

        {deviations.length > 0 && (
          <div className="bg-[var(--surface)] border-2 border-[var(--border)] p-4 max-w-md text-left flex flex-col gap-3">
            <p className="text-sm text-[var(--pr)] uppercase tracking-wide">
              Ecarts par rapport au prevu
            </p>
            <ul className="flex flex-col gap-1.5">
              {deviations.map((d, i) => (
                <li key={i} className="text-sm text-[var(--text)]">
                  <span className="text-[var(--text-muted)]">
                    {d.exerciseName} — {d.setLabel}:
                  </span>{' '}
                  <span className="font-mono-num">{describeDeviation(d)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
              Veux-tu adapter les prochaines seances de la semaine prochaine en fonction de ces
              resultats ?
            </p>
            {programId && (
              <Link to={`/programs/${programId}`}>
                <Button className="w-full">Adapter la periodisation</Button>
              </Link>
            )}
          </div>
        )}

        {feedbackSubmitted ? (
          <p className="text-sm text-[var(--success)]">Merci pour ton retour !</p>
        ) : (
          <div className="bg-[var(--surface)] border-2 border-[var(--border)] p-4 max-w-md text-left flex flex-col gap-4">
            <p className="text-sm text-[var(--pr)] uppercase tracking-wide">
              Comment s'est passee la seance ?
            </p>
            <RatingPicker
              label="Intensite"
              hint="1 = trop facile, 10 = trop dur"
              value={intensityRating}
              onChange={setIntensityRating}
            />
            <RatingPicker
              label="Duree"
              hint="1 = trop courte, 10 = trop longue"
              value={durationRating}
              onChange={setDurationRating}
            />
            <RatingPicker
              label="Pertinence des exos"
              hint="1 = pas adaptes, 10 = parfaitement adaptes"
              value={relevanceRating}
              onChange={setRelevanceRating}
            />
            <div className="flex gap-3 items-center">
              <Button
                onClick={submitFeedback}
                isLoading={feedbackSubmitting}
                disabled={
                  intensityRating == null || durationRating == null || relevanceRating == null
                }
              >
                Envoyer
              </Button>
              <button
                onClick={() => setFeedbackSubmitted(true)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Passer
              </button>
            </div>
          </div>
        )}

        <Link to="/">
          <Button variant={deviations.length > 0 ? 'secondary' : 'primary'}>
            Retour a l'accueil
          </Button>
        </Link>
      </div>
    )
  }

  // --- Ecran repos ---
  if (phase === 'rest' && current) {
    const remaining = current.restSeconds - restElapsed
    const overtime = remaining < 0

    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-8 px-6">
        <SessionClock seconds={sessionElapsed} />
        <TrainingTimeline flatSets={flatSets} currentIndex={currentIndex} />
        <p className="text-[var(--text-muted)] uppercase tracking-wide text-sm">
          Repos {restPaused && '(pause)'}
        </p>
        <p
          className="font-mono-num text-6xl"
          style={{ color: overtime ? 'var(--danger)' : 'var(--text)', opacity: restPaused ? 0.5 : 1 }}
        >
          {formatTime(remaining)}
        </p>
        {overtime && !restPaused && (
          <p className="text-[var(--danger)] text-sm">Temps de repos depasse</p>
        )}

        <Button variant="secondary" onClick={togglePause} className="text-sm">
          {restPaused ? '▸ Reprendre' : '‖ Pause'}
        </Button>

        <div className="w-full max-w-xs flex flex-col gap-1.5">
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
            Note sur cette serie (optionnel)
          </label>
          <textarea
            value={commentDraft}
            onChange={(e) => {
              setCommentDraft(e.target.value)
              updateSetLog(current.blockId, current.setIdx, {
                comment: e.target.value || null,
              })
            }}
            placeholder="Ex: forme cassee, douleur epaule, trop facile..."
            rows={2}
            className="bg-[var(--surface-2)] border-2 border-[var(--border)] px-2 py-1.5 text-sm focus:border-[var(--pr)] outline-none resize-none"
          />
        </div>

        {next && (
          <p className="text-[var(--text-muted)] text-sm text-center">
            Ensuite: {next.exerciseName} — {next.label} · {next.reps} reps
            {next.weight != null ? ` · ${next.weight}kg` : ''}
          </p>
        )}

        <Button onClick={goToNextSet}>Serie suivante</Button>
        {currentIndex > 0 && (
          <Button variant="secondary" onClick={goToPreviousSet} className="text-sm">
            ◂ Serie precedente
          </Button>
        )}
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
      <SessionClock seconds={sessionElapsed} />
      <TrainingTimeline flatSets={flatSets} currentIndex={currentIndex} />
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

        {current.noSetsMode ? (
          <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
            Pas de series a remplir pour cet exo — fais-le puis valide quand c'est termine.
          </p>
        ) : (
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
        )}

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

        {currentIndex > 0 && (
          <button
            onClick={goToPreviousSet}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            ◂ Serie precedente
          </button>
        )}
      </main>
    </div>
  )
}
