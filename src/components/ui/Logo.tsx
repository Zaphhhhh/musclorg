import { Link } from 'react-router-dom'

// Logo texte partage entre toutes les pages. Avant, certaines pages
// l'affichaient via un <h1> (police display) et d'autres via un simple
// <Link> stylise (police body) -> incoherence visuelle en naviguant.
export default function Logo() {
  return (
    <Link
      to="/"
      className="text-xl no-underline text-[var(--text)] uppercase tracking-wide"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      MusclOrg
    </Link>
  )
}
