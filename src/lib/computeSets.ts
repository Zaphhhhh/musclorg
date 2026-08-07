import type { SessionBlock, SetIntensity } from '../types/program'

export interface ComputedSet {
  label: string
  reps: number | 'AMRAP'
  weight: number | null // null = pas de charge chiffrable (ex: PR non defini)
  restSeconds?: number
  overridden?: boolean
  repsOverridden?: boolean
  intensity?: SetIntensity | null
}

// Resout le poids de base d'un bloc: soit la valeur fixe, soit
// current_pr de l'exo * weight_pct / 100. Retourne null si le mode
// est "pct_pr" mais qu'aucun PR n'est renseigne pour l'exo.
export function resolveBaseWeight(
  block: Pick<SessionBlock, 'weight_mode' | 'weight' | 'weight_pct'>,
  exercisePr: number | null
): number | null {
  if (block.weight_mode === 'fixed') return block.weight ?? null
  if (exercisePr == null || block.weight_pct == null) return null
  return Math.round(exercisePr * (block.weight_pct / 100) * 10) / 10
}

export function computeSets(
  block: SessionBlock,
  baseWeight: number | null,
  exercisePr: number | null
): ComputedSet[] {
  const rawSets: ComputedSet[] = Array.from({ length: block.sets }, (_, i) => ({
    label: `Serie ${i + 1}`,
    reps: block.reps,
    weight: baseWeight,
  }))

  const overrides = block.set_overrides ?? []
  const repsOverrides = block.set_reps_overrides ?? []
  const intensities = block.set_intensity ?? []

  return rawSets.map((set, i) => {
    let result = set

    const override = overrides[i]
    if (override) {
      const weight =
        override.mode === 'fixed'
          ? override.value
          : exercisePr != null
            ? Math.round(exercisePr * (override.value / 100) * 10) / 10
            : null
      result = { ...result, weight, overridden: true }
    }

    const repsOverride = repsOverrides[i]
    if (repsOverride != null) {
      result = { ...result, reps: repsOverride, repsOverridden: true }
    }

    const intensity = intensities[i]
    if (intensity) {
      result = { ...result, intensity }
    }

    return result
  })
}
