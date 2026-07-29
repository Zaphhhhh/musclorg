import type { SessionBlock } from '../types/program'
import type {
  BackOffConfig,
  ClusterConfig,
  DropSetConfig,
  MyoRepsConfig,
  PyramidConfig,
  RestPauseConfig,
} from '../types/setStrategy'

export interface ComputedSet {
  label: string
  reps: number | 'AMRAP'
  weight: number | null // null = pas de charge chiffrable (ex: PR non defini)
  restSeconds?: number
  overridden?: boolean
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

function pct(base: number | null, p: number): number | null {
  if (base == null) return null
  return Math.round(base * (p / 100) * 10) / 10
}

export function computeSets(
  block: SessionBlock,
  baseWeight: number | null,
  exercisePr: number | null
): ComputedSet[] {
  const rawSets = computeBaseSets(block, baseWeight)
  const overrides = block.set_overrides ?? []

  return rawSets.map((set, i) => {
    const override = overrides[i]
    if (!override) return set

    const weight =
      override.mode === 'fixed'
        ? override.value
        : exercisePr != null
          ? Math.round(exercisePr * (override.value / 100) * 10) / 10
          : null

    return { ...set, weight, overridden: true }
  })
}

function computeBaseSets(block: SessionBlock, baseWeight: number | null): ComputedSet[] {
  const config = block.set_strategy_config

  switch (block.set_strategy) {
    case 'straight': {
      return Array.from({ length: block.sets }, (_, i) => ({
        label: `Serie ${i + 1}`,
        reps: block.reps,
        weight: baseWeight,
      }))
    }

    case 'pyramid_up':
    case 'pyramid_down': {
      const cfg = config as PyramidConfig | null
      const steps = cfg?.steps ?? []
      return steps.map((step, i) => ({
        label: `Serie ${i + 1}`,
        reps: step.reps,
        weight: pct(baseWeight, step.weight_pct),
      }))
    }

    case 'back_off': {
      const cfg = config as BackOffConfig | null
      if (!cfg) return []
      const topSets = Array.from({ length: cfg.top_sets }, (_, i) => ({
        label: `Top set ${i + 1}`,
        reps: cfg.top_reps,
        weight: pct(baseWeight, cfg.top_weight_pct),
      }))
      const backOffSets = Array.from({ length: cfg.back_off_sets }, (_, i) => ({
        label: `Back-off ${i + 1}`,
        reps: cfg.back_off_reps,
        weight: pct(baseWeight, cfg.back_off_weight_pct),
      }))
      return [...topSets, ...backOffSets]
    }

    case 'drop_set': {
      const cfg = config as DropSetConfig | null
      const main: ComputedSet = {
        label: 'Serie principale',
        reps: block.reps,
        weight: baseWeight,
      }
      let current = baseWeight
      const drops = (cfg?.drops ?? []).map((drop, i) => {
        current = current == null ? null : Math.round(current * (1 - drop.weight_pct_reduction / 100) * 10) / 10
        return {
          label: `Drop ${i + 1}`,
          reps: drop.reps,
          weight: current,
        }
      })
      return [main, ...drops]
    }

    case 'rest_pause': {
      const cfg = config as RestPauseConfig | null
      if (!cfg) return []
      const main: ComputedSet = {
        label: 'Serie principale',
        reps: cfg.initial_reps,
        weight: baseWeight,
      }
      const minis = Array.from({ length: cfg.mini_sets }, (_, i) => ({
        label: `Mini-serie ${i + 1}`,
        reps: 'AMRAP' as const,
        weight: baseWeight,
        restSeconds: cfg.rest_seconds_between,
      }))
      return [main, ...minis]
    }

    case 'cluster': {
      const cfg = config as ClusterConfig | null
      if (!cfg) return []
      return Array.from({ length: cfg.clusters }, (_, i) => ({
        label: `Cluster ${i + 1}`,
        reps: cfg.reps_per_cluster,
        weight: baseWeight,
        restSeconds: i < cfg.clusters - 1 ? cfg.intra_set_rest_seconds : undefined,
      }))
    }

    case 'amrap_last_set': {
      const sets: ComputedSet[] = Array.from({ length: Math.max(block.sets - 1, 0) }, (_, i) => ({
        label: `Serie ${i + 1}`,
        reps: block.reps,
        weight: baseWeight,
      }))
      sets.push({ label: `Serie ${block.sets}`, reps: 'AMRAP', weight: baseWeight })
      return sets
    }

    case 'myo_reps': {
      const cfg = config as MyoRepsConfig | null
      if (!cfg) return []
      const activation: ComputedSet = {
        label: 'Serie d\'activation',
        reps: cfg.activation_reps,
        weight: baseWeight,
      }
      const minis = Array.from({ length: cfg.mini_sets_count }, (_, i) => ({
        label: `Mini-serie ${i + 1}`,
        reps: cfg.mini_set_reps,
        weight: baseWeight,
        restSeconds: cfg.mini_set_rest_seconds,
      }))
      return [activation, ...minis]
    }

    default:
      return []
  }
}
