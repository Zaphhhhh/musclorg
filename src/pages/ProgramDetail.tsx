import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useProgramDetail } from '../hooks/useProgramDetail'
import { useExercises } from '../hooks/useExercises'
import ExerciseLibraryPanel from '../components/programs/ExerciseLibraryPanel'
import PhaseSection from '../components/programs/PhaseSection'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { PERIODIZATION_TYPES, PERIODIZATION_LABELS } from '../types/program'
import type { PeriodizationType } from '../types/program'
import type { Exercise } from '../types/exercise'

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
    setBlockStrategy,
    deleteBlock,
    reorderBlocksInSession,
  } = useProgramDetail(id)
  const { exercises, loading: exercisesLoading } = useExercises()

  const [addingPhase, setAddingPhase] = useState(false)
  const [phaseName, setPhaseName] = useState('')
  const [phaseType, setPhaseType] = useState<PeriodizationType>('lineaire')
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [libraryVisible, setLibraryVisible] = useState(true)

  const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveExercise(null)
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Cas 1: on depose un exo de la bibliotheque sur une seance -> nouveau bloc
    if (activeData?.type === 'exercise') {
      const sessionId =
        overData?.type === 'session' ? (overData.sessionId as string) : findSessionOfBlock(over.id as string)
      if (sessionId) addBlockFromExercise(sessionId, activeData.exercise as Exercise)
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
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/programs" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            ← Programmes
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
        <main className="max-w-[1800px] mx-auto px-6 py-8 flex gap-4 items-start">
          <button
            onClick={() => setLibraryVisible((v) => !v)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-md px-2 py-1.5 shrink-0"
            title={libraryVisible ? 'Masquer la bibliotheque' : 'Afficher la bibliotheque'}
          >
            {libraryVisible ? '◂' : '▸'}
          </button>
          {libraryVisible && (
            <ExerciseLibraryPanel exercises={exercises} loading={exercisesLoading} />
          )}

          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {program.phases.map((phase) => (
              <PhaseSection
                key={phase.id}
                phase={phase}
                exercisesById={exercisesById}
                onAddWeek={(isDeload) => addWeek(phase.id, isDeload)}
                onDeletePhase={() => deletePhase(phase.id)}
                onDeleteWeek={(weekId) => deleteWeek(weekId)}
                onAddSession={(weekId, name, day) => addSession(weekId, name, day)}
                onDeleteSession={(sessionId) => deleteSession(sessionId)}
                onUpdateBlock={(blockId, updates) => updateBlock(blockId, updates)}
                onStrategyChange={(blockId, strategy) => setBlockStrategy(blockId, strategy)}
                onDeleteBlock={(blockId) => deleteBlock(blockId)}
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
