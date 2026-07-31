import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Exercise } from '../types/exercise'
import type {
  ProgramWithTree,
  PeriodizationType,
  SessionBlock,
} from '../types/program'
import type { SetStrategyType, SetStrategyConfig } from '../types/setStrategy'
import { defaultConfigFor } from '../types/setStrategy'

const TREE_SELECT = `
  *,
  phases (
    *,
    weeks (
      *,
      sessions (
        *,
        session_blocks (*)
      )
    )
  )
`

function sortTree(program: ProgramWithTree): ProgramWithTree {
  const phases = [...program.phases]
    .sort((a, b) => a.order_index - b.order_index)
    .map((phase) => ({
      ...phase,
      weeks: [...phase.weeks]
        .sort((a, b) => a.week_number - b.week_number)
        .map((week) => ({
          ...week,
          sessions: [...week.sessions]
            .sort((a, b) => a.order_index - b.order_index)
            .map((session) => ({
              ...session,
              session_blocks: [...session.session_blocks].sort(
                (a, b) => a.order_index - b.order_index
              ),
            })),
        })),
    }))

  return { ...program, phases }
}

export function useProgramDetail(programId: string | undefined) {
  const [program, setProgram] = useState<ProgramWithTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pendingBlockUpdates = useRef<Record<string, Partial<SessionBlock>>>({})
  const blockUpdateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchProgram = useCallback(async () => {
    if (!programId) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('programs')
      .select(TREE_SELECT)
      .eq('id', programId)
      .single()

    if (error) setError(error.message)
    else setProgram(sortTree(data as unknown as ProgramWithTree))

    setLoading(false)
  }, [programId])

  useEffect(() => {
    fetchProgram()
  }, [fetchProgram])

  // --- Phases ---
  const addPhase = useCallback(
    async (name: string, periodizationType: PeriodizationType) => {
      if (!programId || !program) return
      const orderIndex = program.phases.length

      const { error } = await supabase.from('phases').insert({
        program_id: programId,
        name,
        periodization_type: periodizationType,
        order_index: orderIndex,
      })

      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [programId, program, fetchProgram]
  )

  const deletePhase = useCallback(
    async (phaseId: string) => {
      const { error } = await supabase.from('phases').delete().eq('id', phaseId)
      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [fetchProgram]
  )

  // --- Weeks ---
  const addWeek = useCallback(
    async (phaseId: string, isDeload: boolean) => {
      const phase = program?.phases.find((p) => p.id === phaseId)
      const weekNumber = (phase?.weeks.length ?? 0) + 1

      const { error } = await supabase.from('weeks').insert({
        phase_id: phaseId,
        week_number: weekNumber,
        is_deload: isDeload,
      })

      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [program, fetchProgram]
  )

  const deleteWeek = useCallback(
    async (weekId: string) => {
      const { error } = await supabase.from('weeks').delete().eq('id', weekId)
      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [fetchProgram]
  )

  // --- Sessions ---
  const addSession = useCallback(
    async (weekId: string, name: string, dayOfWeek: number | null) => {
      const week = program?.phases
        .flatMap((p) => p.weeks)
        .find((w) => w.id === weekId)
      const orderIndex = week?.sessions.length ?? 0

      const { error } = await supabase.from('sessions').insert({
        week_id: weekId,
        name,
        day_of_week: dayOfWeek,
        order_index: orderIndex,
      })

      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [program, fetchProgram]
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [fetchProgram]
  )

  // --- Session blocks ---
  const addBlockFromExercise = useCallback(
    async (sessionId: string, exercise: Exercise) => {
      const session = program?.phases
        .flatMap((p) => p.weeks)
        .flatMap((w) => w.sessions)
        .find((s) => s.id === sessionId)
      const orderIndex = session?.session_blocks.length ?? 0

      const { error } = await supabase.from('session_blocks').insert({
        session_id: sessionId,
        exercise_id: exercise.id,
        order_index: orderIndex,
        sets: exercise.default_sets ?? 3,
        reps: exercise.default_reps ?? 10,
        weight: exercise.default_weight,
        rest_seconds: exercise.default_rest_seconds ?? 90,
        set_strategy: 'straight',
        set_strategy_config: defaultConfigFor('straight'),
        is_accessory: false,
      })

      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [program, fetchProgram]
  )

  const updateBlock = useCallback(
    (blockId: string, updates: Partial<SessionBlock>) => {
      // maj locale immediate: l'UI reste reactive a chaque frappe
      setProgram((prev) => {
        if (!prev) return prev
        return sortTree({
          ...prev,
          phases: prev.phases.map((phase) => ({
            ...phase,
            weeks: phase.weeks.map((week) => ({
              ...week,
              sessions: week.sessions.map((session) => ({
                ...session,
                session_blocks: session.session_blocks.map((b) =>
                  b.id === blockId ? { ...b, ...updates } : b
                ),
              })),
            })),
          })),
        })
      })

      // ecriture reseau regroupee (debounce): on accumule les patches
      // successifs et on ecrit une fois que la frappe s'arrete, au lieu
      // d'une requete + refetch complet a chaque caractere tape.
      pendingBlockUpdates.current[blockId] = {
        ...pendingBlockUpdates.current[blockId],
        ...updates,
      }

      clearTimeout(blockUpdateTimers.current[blockId])
      blockUpdateTimers.current[blockId] = setTimeout(async () => {
        const patch = pendingBlockUpdates.current[blockId]
        delete pendingBlockUpdates.current[blockId]
        if (!patch) return

        const { error } = await supabase.from('session_blocks').update(patch).eq('id', blockId)
        if (error) {
          setError(error.message)
          await fetchProgram() // resynchronise si l'ecriture a echoue
        }
      }, 400)
    },
    [fetchProgram]
  )

  const setBlockStrategy = useCallback(
    (blockId: string, strategy: SetStrategyType) =>
      updateBlock(blockId, {
        set_strategy: strategy,
        set_strategy_config: defaultConfigFor(strategy) as SetStrategyConfig,
        set_overrides: null,
      }),
    [updateBlock]
  )

  const deleteBlock = useCallback(
    async (blockId: string) => {
      const { error } = await supabase.from('session_blocks').delete().eq('id', blockId)
      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [fetchProgram]
  )

  const reorderBlocksInSession = useCallback(
    async (sessionId: string, orderedBlockIds: string[]) => {
      // maj optimiste locale
      setProgram((prev) => {
        if (!prev) return prev
        return sortTree({
          ...prev,
          phases: prev.phases.map((phase) => ({
            ...phase,
            weeks: phase.weeks.map((week) => ({
              ...week,
              sessions: week.sessions.map((session) =>
                session.id !== sessionId
                  ? session
                  : {
                      ...session,
                      session_blocks: orderedBlockIds.map((id, index) => {
                        const block = session.session_blocks.find((b) => b.id === id)!
                        return { ...block, order_index: index }
                      }),
                    }
              ),
            })),
          })),
        })
      })

      // persistance (une requete par bloc, ok pour des petites listes)
      await Promise.all(
        orderedBlockIds.map((id, index) =>
          supabase.from('session_blocks').update({ order_index: index }).eq('id', id)
        )
      )
    },
    []
  )

  // --- Copie ---
  const findSession = useCallback(
    (sessionId: string) =>
      program?.phases.flatMap((p) => p.weeks).flatMap((w) => w.sessions).find((s) => s.id === sessionId),
    [program]
  )

  const findBlock = useCallback(
    (blockId: string) =>
      program?.phases
        .flatMap((p) => p.weeks)
        .flatMap((w) => w.sessions)
        .flatMap((s) => s.session_blocks)
        .find((b) => b.id === blockId),
    [program]
  )

  const copySessionToWeek = useCallback(
    async (sessionId: string, targetWeekId: string) => {
      const sourceSession = findSession(sessionId)
      if (!sourceSession) return { error: 'Seance source introuvable' }

      const targetWeek = program?.phases.flatMap((p) => p.weeks).find((w) => w.id === targetWeekId)
      const orderIndex = targetWeek?.sessions.length ?? 0

      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          week_id: targetWeekId,
          name: sourceSession.name,
          day_of_week: sourceSession.day_of_week,
          order_index: orderIndex,
        })
        .select()
        .single()

      if (sessionError || !newSession) return { error: sessionError?.message ?? 'Erreur' }

      if (sourceSession.session_blocks.length > 0) {
        const blockCopies = sourceSession.session_blocks.map((block) => ({
          session_id: newSession.id,
          exercise_id: block.exercise_id,
          order_index: block.order_index,
          sets: block.sets,
          reps: block.reps,
          weight: block.weight,
          weight_mode: block.weight_mode,
          weight_pct: block.weight_pct,
          set_overrides: block.set_overrides,
          rest_seconds: block.rest_seconds,
          set_strategy: block.set_strategy,
          set_strategy_config: block.set_strategy_config,
          is_accessory: block.is_accessory,
        }))

        const { error: blocksError } = await supabase.from('session_blocks').insert(blockCopies)
        if (blocksError) return { error: blocksError.message }
      }

      await fetchProgram()
      return { error: null }
    },
    [program, findSession, fetchProgram]
  )

  const copyBlockToSession = useCallback(
    async (blockId: string, targetSessionId: string) => {
      const sourceBlock = findBlock(blockId)
      if (!sourceBlock) return { error: 'Bloc source introuvable' }

      const targetSession = findSession(targetSessionId)
      const orderIndex = targetSession?.session_blocks.length ?? 0

      const { error } = await supabase.from('session_blocks').insert({
        session_id: targetSessionId,
        exercise_id: sourceBlock.exercise_id,
        order_index: orderIndex,
        sets: sourceBlock.sets,
        reps: sourceBlock.reps,
        weight: sourceBlock.weight,
        weight_mode: sourceBlock.weight_mode,
        weight_pct: sourceBlock.weight_pct,
        set_overrides: sourceBlock.set_overrides,
        rest_seconds: sourceBlock.rest_seconds,
        set_strategy: sourceBlock.set_strategy,
        set_strategy_config: sourceBlock.set_strategy_config,
        is_accessory: sourceBlock.is_accessory,
      })

      if (error) return { error: error.message }
      await fetchProgram()
      return { error: null }
    },
    [findBlock, findSession, fetchProgram]
  )

  // Copie un mesocycle (phase) entier, avec toutes ses semaines/seances/
  // blocs, vers un programme cible (peut etre le meme programme, pour
  // une simple duplication, ou un autre programme de l'utilisateur).
  const copyPhaseToProgram = useCallback(
    async (phaseId: string, targetProgramId: string) => {
      const sourcePhase = program?.phases.find((p) => p.id === phaseId)
      if (!sourcePhase) return { error: 'Phase source introuvable' }

      const { count } = await supabase
        .from('phases')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', targetProgramId)

      const { data: newPhase, error: phaseError } = await supabase
        .from('phases')
        .insert({
          program_id: targetProgramId,
          name: sourcePhase.name,
          periodization_type: sourcePhase.periodization_type,
          order_index: count ?? 0,
          volume_config: sourcePhase.volume_config,
        })
        .select()
        .single()

      if (phaseError || !newPhase) return { error: phaseError?.message ?? 'Erreur' }

      for (const week of sourcePhase.weeks) {
        const { data: newWeek, error: weekError } = await supabase
          .from('weeks')
          .insert({
            phase_id: newPhase.id,
            week_number: week.week_number,
            is_deload: week.is_deload,
          })
          .select()
          .single()
        if (weekError || !newWeek) continue

        for (const session of week.sessions) {
          const { data: newSession, error: sessionError } = await supabase
            .from('sessions')
            .insert({
              week_id: newWeek.id,
              name: session.name,
              day_of_week: session.day_of_week,
              order_index: session.order_index,
            })
            .select()
            .single()
          if (sessionError || !newSession) continue

          if (session.session_blocks.length > 0) {
            const blockCopies = session.session_blocks.map((block) => ({
              session_id: newSession.id,
              exercise_id: block.exercise_id,
              order_index: block.order_index,
              sets: block.sets,
              reps: block.reps,
              weight: block.weight,
              weight_mode: block.weight_mode,
              weight_pct: block.weight_pct,
              set_overrides: block.set_overrides,
              rest_seconds: block.rest_seconds,
              set_strategy: block.set_strategy,
              set_strategy_config: block.set_strategy_config,
              is_accessory: block.is_accessory,
            }))
            await supabase.from('session_blocks').insert(blockCopies)
          }
        }
      }

      if (targetProgramId === programId) await fetchProgram()
      return { error: null }
    },
    [program, programId, fetchProgram]
  )

  return {
    program,
    loading,
    error,
    refetch: fetchProgram,
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
    copySessionToWeek,
    copyBlockToSession,
    copyPhaseToProgram,
  }
}
