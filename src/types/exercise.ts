export const MUSCLE_GROUPS = [
  'Pecs',
  'Dos',
  'Jambes',
  'Epaules',
  'Bras',
  'Abdos',
  'Full body',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export interface WarmupStep {
  pct: number
  reps: number
}

export interface WarmupConfig {
  steps: WarmupStep[]
}

// L'exo est un element de catalogue: juste "quoi" (le mouvement), pas
// "comment" (series/reps/poids/strategie), qui varie a chaque utilisation
// dans un bloc de seance (session_block, cf types/setStrategy.ts).
// Les champs default_* ci-dessous sont de simples suggestions optionnelles
// pour pre-remplir un bloc, jamais l'implementation reelle.
export interface Exercise {
  id: string
  user_id: string
  name: string
  muscle_group: MuscleGroup | null
  default_sets: number | null
  default_reps: number | null
  default_weight: number | null
  default_rest_seconds: number | null
  warmup_enabled: boolean
  warmup_config: WarmupConfig | null
  created_at: string
  updated_at: string
}

// Champs fournis par l'utilisateur a la creation/edition
export type ExerciseInput = Omit<
  Exercise,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
