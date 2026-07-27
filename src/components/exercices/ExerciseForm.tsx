import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { MUSCLE_GROUPS } from '../../types/exercise'
import type { Exercise, ExerciseInput } from '../../types/exercise'

interface ExerciseFormProps {
  initial?: Exercise
  onSubmit: (input: ExerciseInput) => Promise<{ error: string | null }>
  onCancel: () => void
}

export default function ExerciseForm({ initial, onSubmit, onCancel }: ExerciseFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState(initial?.muscle_group ?? MUSCLE_GROUPS[0])
  const [warmupEnabled, setWarmupEnabled] = useState(initial?.warmup_enabled ?? false)
  const [showDefaults, setShowDefaults] = useState(
    initial ? Boolean(initial.default_sets || initial.default_reps || initial.default_weight) : false
  )
  const [sets, setSets] = useState(initial?.default_sets ?? '')
  const [reps, setReps] = useState(initial?.default_reps ?? '')
  const [weight, setWeight] = useState(initial?.default_weight ?? '')
  const [rest, setRest] = useState(initial?.default_rest_seconds ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await onSubmit({
      name,
      muscle_group: muscleGroup,
      default_sets: showDefaults && sets !== '' ? Number(sets) : null,
      default_reps: showDefaults && reps !== '' ? Number(reps) : null,
      default_weight: showDefaults && weight !== '' ? Number(weight) : null,
      default_rest_seconds: showDefaults && rest !== '' ? Number(rest) : null,
      warmup_enabled: warmupEnabled,
      warmup_config: initial?.warmup_config ?? null,
    })

    setSubmitting(false)
    if (error) setError(error)
    else onCancel()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4"
    >
      <h3 className="text-lg mb-1">{initial ? "Modifier l'exercice" : 'Nouvel exercice'}</h3>
      <p className="text-sm text-[var(--text-muted)] -mt-3">
        Un exercice, c'est juste le mouvement. Les series, reps, poids et strategie se
        configurent a chaque fois que tu l'ajoutes dans une seance.
      </p>

      <Input
        label="Nom de l'exercice"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Developpe couche"
        required
      />

      <Select
        label="Groupe musculaire"
        options={MUSCLE_GROUPS}
        value={muscleGroup ?? MUSCLE_GROUPS[0]}
        onChange={(e) => setMuscleGroup(e.target.value as typeof muscleGroup)}
      />

      <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={warmupEnabled}
          onChange={(e) => setWarmupEnabled(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Activer l'echauffement automatique pour cet exo
      </label>

      <div className="border-t border-[var(--border)] pt-4">
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-1">
          <input
            type="checkbox"
            checked={showDefaults}
            onChange={(e) => setShowDefaults(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Definir des valeurs suggerees (optionnel)
        </label>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Juste un point de depart pour pre-remplir un bloc plus tard — tu pourras toujours
          changer series/reps/poids/strategie a chaque seance.
        </p>

        {showDefaults && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Series suggerees"
              type="number"
              min={1}
              value={sets}
              onChange={(e) => setSets(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Reps suggerees"
              type="number"
              min={1}
              value={reps}
              onChange={(e) => setReps(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Poids suggere (kg)"
              type="number"
              min={0}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              label="Repos suggere (s)"
              type="number"
              min={0}
              step={5}
              value={rest}
              onChange={(e) => setRest(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <Button type="submit" isLoading={submitting}>
          {initial ? 'Enregistrer' : 'Creer'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
