// Strategies de series les plus courantes en musculation / halterophilie.
// Ceci vit au niveau du "session_block" (l'implementation d'un exo dans une
// seance donnee), pas au niveau de l'exo lui-meme -> un meme exo peut avoir
// une strategie differente d'une semaine a l'autre.

export const SET_STRATEGIES = [
  'straight',
  'pyramid_up',
  'pyramid_down',
  'back_off',
  'drop_set',
  'rest_pause',
  'cluster',
  'amrap_last_set',
  'myo_reps',
] as const

export type SetStrategyType = (typeof SET_STRATEGIES)[number]

export const SET_STRATEGY_LABELS: Record<SetStrategyType, string> = {
  straight: 'Series droites',
  pyramid_up: 'Pyramide montante',
  pyramid_down: 'Pyramide descendante (degressif)',
  back_off: 'Back-off sets',
  drop_set: 'Drop set',
  rest_pause: 'Rest-pause',
  cluster: 'Cluster set',
  amrap_last_set: 'Derniere serie AMRAP',
  myo_reps: 'Myo-reps',
}

export const SET_STRATEGY_DESCRIPTIONS: Record<SetStrategyType, string> = {
  straight: 'Meme charge et memes reps a chaque serie.',
  pyramid_up: 'La charge augmente et les reps diminuent a chaque serie.',
  pyramid_down: 'La charge diminue et les reps augmentent a chaque serie.',
  back_off:
    '1 a 2 series lourdes (top set), puis des series de volume a charge reduite.',
  drop_set:
    'A la fin d\'une serie, on reduit immediatement la charge sans repos pour continuer.',
  rest_pause:
    'Courtes pauses (10-20s) au sein d\'une meme serie pour grappiller des reps a charge constante.',
  cluster:
    'Petits groupes de reps a charge lourde, separes par un repos intra-serie planifie.',
  amrap_last_set: 'La derniere serie est effectuee jusqu\'a l\'echec ou le max de reps.',
  myo_reps:
    'Une serie d\'activation proche de l\'echec, suivie de plusieurs mini-series tres courtes.',
}

// --- Configs specifiques a chaque strategie ---

export interface StraightConfig {
  type: 'straight'
}

export interface PyramidStep {
  reps: number
  weight_pct: number // % du poids de travail de reference
}
export interface PyramidConfig {
  type: 'pyramid_up' | 'pyramid_down'
  steps: PyramidStep[]
}

export interface BackOffConfig {
  type: 'back_off'
  top_sets: number
  top_reps: number
  top_weight_pct: number // ex: 100 = poids de reference
  back_off_sets: number
  back_off_reps: number
  back_off_weight_pct: number // ex: 80 = -20%
}

export interface DropSetConfig {
  type: 'drop_set'
  drops: { reps: number; weight_pct_reduction: number }[]
}

export interface RestPauseConfig {
  type: 'rest_pause'
  initial_reps: number
  mini_sets: number
  rest_seconds_between: number
}

export interface ClusterConfig {
  type: 'cluster'
  reps_per_cluster: number
  clusters: number
  intra_set_rest_seconds: number
}

export interface AmrapLastSetConfig {
  type: 'amrap_last_set'
}

export interface MyoRepsConfig {
  type: 'myo_reps'
  activation_reps: number
  mini_set_reps: number
  mini_sets_count: number
  mini_set_rest_seconds: number
}

export type SetStrategyConfig =
  | StraightConfig
  | PyramidConfig
  | BackOffConfig
  | DropSetConfig
  | RestPauseConfig
  | ClusterConfig
  | AmrapLastSetConfig
  | MyoRepsConfig

export function defaultConfigFor(type: SetStrategyType): SetStrategyConfig {
  switch (type) {
    case 'straight':
      return { type: 'straight' }
    case 'pyramid_up':
      return {
        type: 'pyramid_up',
        steps: [
          { reps: 12, weight_pct: 70 },
          { reps: 8, weight_pct: 85 },
          { reps: 4, weight_pct: 100 },
        ],
      }
    case 'pyramid_down':
      return {
        type: 'pyramid_down',
        steps: [
          { reps: 4, weight_pct: 100 },
          { reps: 8, weight_pct: 85 },
          { reps: 12, weight_pct: 70 },
        ],
      }
    case 'back_off':
      return {
        type: 'back_off',
        top_sets: 1,
        top_reps: 5,
        top_weight_pct: 100,
        back_off_sets: 2,
        back_off_reps: 8,
        back_off_weight_pct: 80,
      }
    case 'drop_set':
      return {
        type: 'drop_set',
        drops: [
          { reps: 8, weight_pct_reduction: 20 },
          { reps: 6, weight_pct_reduction: 20 },
        ],
      }
    case 'rest_pause':
      return { type: 'rest_pause', initial_reps: 8, mini_sets: 2, rest_seconds_between: 15 }
    case 'cluster':
      return { type: 'cluster', reps_per_cluster: 3, clusters: 4, intra_set_rest_seconds: 20 }
    case 'amrap_last_set':
      return { type: 'amrap_last_set' }
    case 'myo_reps':
      return {
        type: 'myo_reps',
        activation_reps: 12,
        mini_set_reps: 4,
        mini_sets_count: 4,
        mini_set_rest_seconds: 20,
      }
  }
}
