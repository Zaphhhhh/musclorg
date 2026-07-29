import type { SetStrategyType, SetStrategyConfig } from './setStrategy'

export const PERIODIZATION_TYPES = ['lineaire', 'oscillatoire', 'flat', 'custom'] as const
export type PeriodizationType = (typeof PERIODIZATION_TYPES)[number]

export const PERIODIZATION_LABELS: Record<PeriodizationType, string> = {
  lineaire: 'Lineaire',
  oscillatoire: 'Oscillatoire',
  flat: 'Flat',
  custom: 'Custom',
}

export const DAYS_OF_WEEK = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const

export interface Program {
  id: string
  owner_id: string
  name: string
  description: string | null
  locked_by: string | null
  locked_at: string | null
  created_at: string
  updated_at: string
}

export interface Phase {
  id: string
  program_id: string
  name: string
  periodization_type: PeriodizationType
  order_index: number
  volume_config: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Week {
  id: string
  phase_id: string
  week_number: number
  is_deload: boolean
  created_at: string
}

export interface Session {
  id: string
  week_id: string
  name: string
  day_of_week: number | null // 1 = Lundi ... 7 = Dimanche
  order_index: number
  created_at: string
}

export interface SetOverride {
  mode: 'fixed' | 'pct_pr'
  value: number
}

export interface SessionBlock {
  id: string
  session_id: string
  exercise_id: string
  order_index: number
  sets: number
  reps: number
  weight: number | null
  weight_mode: 'fixed' | 'pct_pr'
  weight_pct: number | null
  // Surcharge manuelle par serie, indexee comme la liste renvoyee par
  // computeSets(). Peut etre un poids fixe ou un % de PR, au choix de
  // chaque serie individuellement. null/absent = utilise le calcul auto.
  set_overrides: (SetOverride | null)[] | null
  rest_seconds: number | null
  set_strategy: SetStrategyType
  set_strategy_config: SetStrategyConfig | null
  superset_group_id: string | null
  is_accessory: boolean
  created_at: string
}

// Arbre complet tel que renvoye par la requete Supabase imbriquee
export interface WeekWithSessions extends Week {
  sessions: SessionWithBlocks[]
}
export interface SessionWithBlocks extends Session {
  session_blocks: SessionBlock[]
}
export interface PhaseWithWeeks extends Phase {
  weeks: WeekWithSessions[]
}
export interface ProgramWithTree extends Program {
  phases: PhaseWithWeeks[]
}
