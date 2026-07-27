import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'

export default function HomePage() {
  const { session, signOut } = useAuth()
  const email = session?.user.email ?? ''
  const firstName = email.split('@')[0]

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl">MusclOrg</h1>
          <Button variant="ghost" onClick={() => signOut()}>
            Se deconnecter
          </Button>
        </div>
      </header>

      <div className="knurl-divider" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-2xl mb-1">Salut, {firstName}</h2>
        <p className="text-[var(--text-muted)] mb-10">
          Voici un apercu de ta semaine. Le tableau de bord et tes seances arrivent bientot ici.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Series cette semaine" value="0" />
          <StatCard label="Seances programmees" value="0" />
          <StatCard label="Phase actuelle" value="—" />
        </div>

        <section className="mt-12 border border-dashed border-[var(--border)] rounded-xl p-10 text-center">
          <p className="text-[var(--text-muted)]">
            Ton tableau de bord de seances arrivera ici — glisse tes blocs d'exos pour
            construire ta semaine.
          </p>
        </section>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <p className="text-[var(--text-muted)] text-sm mb-2">{label}</p>
      <p className="font-mono-num text-3xl text-[var(--text)]">{value}</p>
    </div>
  )
}
