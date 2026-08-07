import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useProgramDetail } from '../hooks/useProgramDetail'
import { usePrograms } from '../hooks/usePrograms'
import { useExercises } from '../hooks/useExercises'
import ExerciseLibraryPanel from '../components/programs/ExerciseLibraryPanel'
import PhaseSection from '../components/programs/PhaseSection'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { PERIODIZATION_TYPES, PERIODIZATION_LABELS } from '../types/program'
import type { PeriodizationType } from '../types/program'
import type { Exercise } from '../types/exercise'
import type { CommonExercise } from '../lib/commonExercises'

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    program,
    loading,
    error,
    addPhase,
    deletePhase,
    addWeek,
    deleteWeek,
    addSession,
    deleteSession,
    addBlockFromExercise,
    updateBlock,
    deleteBlock,
    reorderBlocksInSession,
    copySessionToWeek,
    copyBlockToSession,
    copyPhaseToProgram,
    copyWeekToPhase,
  } = useProgramDetail(id)
  const { exercises, loading: exercisesLoading, createExercise } = useExercises()
  const { programs } = usePrograms()

  const [addingPhase, setAddingPhase] = useState(false)
  const [phaseName, setPhaseName] = useState('')
  const [phaseType, setPhaseType] = useState<PeriodizationType>('lineaire')
  const [activeExercise, setActiveExercise] = useState<Exercise | CommonExercise | null>(null)
  const [libraryVisible, setLibraryVisible] = useState(true)

  const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  const allWeekOptions = useMemo(
    () =>
      program?.phases.flatMap((phase, phaseIndex) =>
        phase.weeks.map((week) => ({
          id: week.id,
          label: `M${phaseIndex + 1} · ${phase.name} · Semaine ${week.week_number}${week.is_deload ? ' (deload)' : ''}`,
        }))
      ) ?? [],
    [program]
  )

  const allSessionOptions = useMemo(
    () =>
      program?.phases.flatMap((phase, phaseIndex) =>
        phase.weeks.flatMap((week) =>
          week.sessions.map((session) => ({
            id: session.id,
            label: `M${phaseIndex + 1} · ${phase.name} · S${week.week_number} · ${session.name}`,
          }))
        )
      ) ?? [],
    [program]
  )

  const allProgramOptions = useMemo(
    () => programs.map((p) => ({ id: p.id, label: p.name })),
    [programs]
  )

  const allPhaseOptions = useMemo(
    () =>
      program?.phases.map((phase, phaseIndex) => ({
        id: phase.id,
        label: `M${phaseIndex + 1} · ${phase.name}`,
      })) ?? [],
    [program]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Capteur dedie au tactile: se declenche apres un appui maintenu
    // plutot qu'un deplacement, pour ne pas se faire voler le geste par
    // le scroll de la page (c'est ca qui empechait le drag sur mobile).
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  const handleAddPhase = async () => {
    if (!phaseName.trim()) return
    await addPhase(phaseName, phaseType)
    setPhaseName('')
    setAddingPhase(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'exercise') setActiveExercise(data.exercise as Exercise)
    else if (data?.type === 'common-exercise') setActiveExercise(data.exercise as CommonExercise)
  }

  // Un exo "courant" n'existe pas encore dans la bibliotheque de
  // l'utilisateur: on le materialise (reutilise s'il existe deja par
  // nom, sinon le cree) avant de creer le bloc.
  const materializeCommonExercise = async (preset: CommonExercise): Promise<Exercise | null> => {
    const existing = exercises.find(
      (e) => e.name.trim().toLowerCase() === preset.name.trim().toLowerCase()
    )
    if (existing) return existing

    const { data, error } = await createExercise({
      name: preset.name,
      primary_muscle_group: preset.primary_muscle_group,
      secondary_muscle_groups: [],
      default_sets: null,
      default_reps: null,
      default_weight: null,
      default_rest_seconds: null,
      warmup_enabled: false,
      warmup_config: null,
      pr_weight: null,
      pr_reps: null,
    })

    if (error || !data) return null
    return data
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveExercise(null)
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Cas 1: on depose un exo (bibliotheque ou catalogue courant) sur
    // une seance -> nouveau bloc
    if (activeData?.type === 'exercise' || activeData?.type === 'common-exercise') {
      const sessionId =
        overData?.type === 'session' ? (overData.sessionId as string) : findSessionOfBlock(over.id as string)
      if (!sessionId) return

      if (activeData.type === 'exercise') {
        addBlockFromExercise(sessionId, activeData.exercise as Exercise)
      } else {
        const exercise = await materializeCommonExercise(activeData.exercise as CommonExercise)
        if (exercise) addBlockFromExercise(sessionId, exercise)
      }
      return
    }

    // Cas 2: on reordonne des blocs a l'interieur de la meme seance
    if (active.id !== over.id) {
      const session = findSessionContaining(active.id as string)
      if (session && session.session_blocks.some((b) => b.id === over.id)) {
        const oldIndex = session.session_blocks.findIndex((b) => b.id === active.id)
        const newIndex = session.session_blocks.findIndex((b) => b.id === over.id)
        const newOrder = arrayMove(session.session_blocks, oldIndex, newIndex).map((b) => b.id)
        reorderBlocksInSession(session.id, newOrder)
      }
    }
  }

  function findSessionContaining(blockId: string) {
    return program?.phases
      .flatMap((p) => p.weeks)
      .flatMap((w) => w.sessions)
      .find((s) => s.session_blocks.some((b) => b.id === blockId))
  }

  function findSessionOfBlock(blockId: string) {
    return findSessionContaining(blockId)?.id
  }

  if (loading) {
    return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text-muted)]">Chargement...</div>
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--danger)]">
        {error ?? 'Programme introuvable'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/programs">
            <Button
              variant="secondary"
              className="p-2"
              aria-label="Retour aux programmes"
              title="Retour aux programmes"
            >
              ◂
            </Button>
          </Link>
          <h1 className="text-xl">{program.name}</h1>
          <div />
        </div>
      </header>
      <div className="knurl-divider" />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
          <div className="flex flex-col lg:contents gap-2">
            <button
              onClick={() => setLibraryVisible((v) => !v)}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] px-2 py-1.5 shrink-0 self-start"
              title={libraryVisible ? 'Masquer la bibliotheque' : 'Afficher la bibliotheque'}
            >
              {libraryVisible ? '◂' : '▸'}
            </button>
            {libraryVisible && (
              <ExerciseLibraryPanel exercises={exercises} loading={exercisesLoading} />
            )}
          </div>

          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {program.phases.map((phase, phaseIndex) => (
              <PhaseSection
                key={phase.id}
                phase={phase}
                phaseNumber={phaseIndex + 1}
                exercisesById={exercisesById}
                onAddWeek={(isDeload) => addWeek(phase.id, isDeload)}
                onDeletePhase={() => deletePhase(phase.id)}
                onDeleteWeek={(weekId) => deleteWeek(weekId)}
                onAddSession={(weekId, name, day) => addSession(weekId, name, day)}
                onDeleteSession={(sessionId) => deleteSession(sessionId)}
                onUpdateBlock={(blockId, updates) => updateBlock(blockId, updates)}
                onDeleteBlock={(blockId) => deleteBlock(blockId)}
                allWeekOptions={allWeekOptions}
                allSessionOptions={allSessionOptions}
                onCopySessionToWeek={copySessionToWeek}
                onCopyBlockToSession={copyBlockToSession}
                allProgramOptions={allProgramOptions}
                onCopyPhaseToProgram={copyPhaseToProgram}
                allPhaseOptions={allPhaseOptions}
                onCopyWeekToPhase={copyWeekToPhase}
              />
            ))}

            {addingPhase ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-3 max-w-sm">
                <Input
                  label="Nom de la phase"
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  placeholder="Ex: Bloc force"
                />
                <Select
                  label="Type de periodisation"
                  options={PERIODIZATION_TYPES.map((t) => PERIODIZATION_LABELS[t])}
                  value={PERIODIZATION_LABELS[phaseType]}
                  onChange={(e) =>
                    setPhaseType(
                      PERIODIZATION_TYPES.find(
                        (t) => PERIODIZATION_LABELS[t] === e.target.value
                      ) ?? 'lineaire'
                    )
                  }
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddPhase}>Creer</Button>
                  <Button variant="secondary" onClick={() => setAddingPhase(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setAddingPhase(true)} className="self-start">
                + Ajouter une phase
              </Button>
            )}
          </div>
        </main>

        <DragOverlay>
          {activeExercise && (
            <div className="bg-[var(--surface-2)] border border-[var(--accent)] rounded-lg px-3 py-2 text-sm shadow-lg">
              {activeExercise.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
