import './globals.css'
import './mission-ui.css'
import './mission-ui-language-english.css'
import './mission-ui-science.css'
import Link from 'next/link'

export const metadata = {
  title: 'LEVEL UP',
  description: 'Entrenador gamificado de 1º ESO',
  robots: { index: false, follow: false },
}

export const viewport = { colorScheme: 'dark', themeColor: '#071321' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es"><body>
      <a className="skip-link" href="#main-content">SALTAR AL CONTENIDO</a>
      <header className="top"><Link href="/world" className="logo">LEVEL <span>UP</span></Link><nav className="main-nav" aria-label="Navegación principal"><Link href="/world"><span aria-hidden="true">🗺️</span> Mundo</Link><Link href="/parent"><span aria-hidden="true">👨‍👦</span> <span className="nav-label-parent">Panel padre</span><span className="nav-label-short">Panel</span></Link></nav></header>
      <div id="main-content" tabIndex={-1}>{children}</div>
    </body></html>
  )
}
