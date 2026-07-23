import { useAuth } from './hooks/useAuth'
import AuthPage from './pages/Auth'

function App() {
  const { session, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  if (!session) return <AuthPage />

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Connecté ✅</h1>
      <p>{session.user.email}</p>
    </div>
  )
}

export default App