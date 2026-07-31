import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import ChipMultiSelect from '../components/ui/ChipMultiSelect'
import Button from '../components/ui/Button'
import {
  SEX_OPTIONS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LABELS,
  GOALS,
  SPORTS,
} from '../types/profile'
import type { ExperienceLevel } from '../types/profile'

export default function ProfilePage() {
  const { profile, loading, updateProfile } = useProfile()

  const [displayName, setDisplayName] = useState('')
  const [sex, setSex] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [heightCm, setHeightCm] = useState<number | ''>('')
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [wingspanCm, setWingspanCm] = useState<number | ''>('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('debutant')
  const [sports, setSports] = useState<string[]>([])
  const [startMonth, setStartMonth] = useState('')
  const [goal, setGoal] = useState('')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setSex(profile.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '')
    setAge(profile.age ?? '')
    setHeightCm(profile.height_cm ?? '')
    setWeightKg(profile.weight_kg ?? '')
    setWingspanCm(profile.wingspan_cm ?? '')
    setExperienceLevel((profile.experience_level as ExperienceLevel) ?? 'debutant')
    setSports(profile.sports ?? [])
    setStartMonth(profile.training_start_date?.slice(0, 7) ?? '')
    setGoal(profile.goal ?? '')
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const { error } = await updateProfile({
      display_name: displayName || null,
      sex: sex ? sex.toLowerCase() : null,
      age: age === '' ? null : age,
      height_cm: heightCm === '' ? null : heightCm,
      weight_kg: weightKg === '' ? null : weightKg,
      wingspan_cm: wingspanCm === '' ? null : wingspanCm,
      experience_level: experienceLevel,
      sports,
      training_start_date: startMonth ? `${startMonth}-01` : null,
      goal: goal || null,
    })

    setSaving(false)
    if (error) setError(error)
    else setSaved(true)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            ← Retour
          </Link>
          <h1 className="text-xl">Mon profil</h1>
          <div />
        </div>
      </header>
      <div className="knurl-divider" />

      <main className="max-w-2xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-[var(--text-muted)]">Chargement...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4"
          >
            <Input
              label="Pseudo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ton pseudo"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Sexe"
                options={['', ...SEX_OPTIONS]}
                value={sex}
                onChange={(e) => setSex(e.target.value)}
              />
              <Input
                label="Age"
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Taille (cm)"
                type="number"
                min={0}
                step={0.5}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <Input
                label="Poids (kg)"
                type="number"
                min={0}
                step={0.5}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <Input
                label="Envergure (cm)"
                type="number"
                min={0}
                step={0.5}
                value={wingspanCm}
                onChange={(e) => setWingspanCm(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <Select
              label="Niveau d'experience"
              options={EXPERIENCE_LEVELS.map((l) => EXPERIENCE_LABELS[l])}
              value={EXPERIENCE_LABELS[experienceLevel]}
              onChange={(e) => {
                const level = EXPERIENCE_LEVELS.find(
                  (l) => EXPERIENCE_LABELS[l] === e.target.value
                )
                if (level) setExperienceLevel(level)
              }}
            />

            <ChipMultiSelect
              label="Sports pratiques"
              options={SPORTS}
              value={sports}
              onChange={setSports}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[var(--text-muted)]">Debut de pratique</label>
                <input
                  type="month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-3 py-2.5 text-[var(--text)] focus:border-[var(--accent)] outline-none"
                />
              </div>
              <Select
                label="Objectif principal"
                options={['', ...GOALS]}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {saved && (
              <p className="text-sm text-[var(--success)] bg-[var(--success)]/10 rounded-md px-3 py-2">
                Profil enregistre.
              </p>
            )}

            <Button type="submit" isLoading={saving} className="self-start mt-2">
              Enregistrer
            </Button>
          </form>
        )}
      </main>
    </div>
  )
}
