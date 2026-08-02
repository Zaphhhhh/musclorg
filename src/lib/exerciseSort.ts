import type { Exercise } from '../types/exercise'

export const EXERCISE_SORT_OPTIONS = [
  'Nom (A-Z)',
  'Nom (Z-A)',
  'Groupe musculaire',
  'Recemment ajoute',
  'PR (poids)',
] as const
export type ExerciseSortOption = (typeof EXERCISE_SORT_OPTIONS)[number]

export function filterAndSortExercises(
  exercises: Exercise[],
  query: string,
  sort: ExerciseSortOption
): Exercise[] {
  const q = query.trim().toLowerCase()

  const filtered = q
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.primary_muscle_group?.toLowerCase().includes(q) ||
          e.secondary_muscle_groups.some((g) => g.toLowerCase().includes(q))
      )
    : exercises

  const sorted = [...filtered]
  switch (sort) {
    case 'Nom (A-Z)':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'Nom (Z-A)':
      sorted.sort((a, b) => b.name.localeCompare(a.name))
      break
    case 'Groupe musculaire':
      sorted.sort((a, b) =>
        (a.primary_muscle_group ?? '').localeCompare(b.primary_muscle_group ?? '')
      )
      break
    case 'Recemment ajoute':
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
      break
    case 'PR (poids)':
      sorted.sort((a, b) => (b.pr_weight ?? 0) - (a.pr_weight ?? 0))
      break
  }
  return sorted
}
