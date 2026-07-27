import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function AuthPage() {
  const { session, loading, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Deja connecte -> direction l'app
  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const { error } =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password)

    setSubmitting(false)

    if (error) setError(error.message)
    else if (mode === 'signup') setMessage('Verifie ton email pour confirmer ton compte.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl">MusclOrg</h1>
          <p className="text-[var(--text-muted)] text-sm mt-2">
            Programme, periodise, progresse.
          </p>
        </div>

        <div className="knurl-divider rounded-full mb-8" />

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4"
        >
          <h2 className="text-lg text-center mb-1">
            {mode === 'signin' ? 'Connexion' : 'Creer un compte'}
          </h2>

          <Input
            label="Email"
            type="email"
            placeholder="toi@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            required
          />

          {error && (
            <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-[var(--success)] bg-[var(--success)]/10 rounded-md px-3 py-2">
              {message}
            </p>
          )}

          <Button type="submit" isLoading={submitting} className="w-full mt-2">
            {mode === 'signin' ? 'Se connecter' : "S'inscrire"}
          </Button>

          <p className="text-sm text-center text-[var(--text-muted)] mt-1">
            {mode === 'signin' ? 'Pas encore de compte ?' : 'Deja un compte ?'}{' '}
            <button
              type="button"
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
                setMessage(null)
              }}
            >
              {mode === 'signin' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
