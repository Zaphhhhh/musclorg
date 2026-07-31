export const SEX_OPTIONS = ['Homme', 'Femme', 'Autre'] as const
export type Sex = (typeof SEX_OPTIONS)[number]

export const EXPERIENCE_LEVELS = ['debutant', 'intermediaire', 'avance'] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  debutant: 'Debutant',
  intermediaire: 'Intermediaire',
  avance: 'Avance',
}

export const GOALS = [
  'Prise de masse',
  'Perte de gras',
  'Force',
  'Performance sportive',
  'Sante generale',
  'Esthetique / Bodybuilding',
] as const

export const SPORTS = [
  'Musculation',
  'Powerlifting',
  'Halterophilie',
  'Crossfit',
  'Course a pied',
  'Natation',
  'Football',
  'Basketball',
  'Rugby',
  'Cyclisme',
  'Boxe / Arts martiaux',
  'Escalade',
  'Autre',
] as const

export interface Profile {
  id: string
  display_name: string | null // = pseudo
  weight_kg: number | null
  height_cm: number | null
  wingspan_cm: number | null
  sex: string | null
  age: number | null
  sports: string[]
  training_start_date: string | null // YYYY-MM-01
  goal: string | null
  experience_level: ExperienceLevel | null
  created_at: string
  updated_at: string
}

export type ProfileInput = Partial<
  Omit<Profile, 'id' | 'created_at' | 'updated_at'>
>
