import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'LEVEL UP',
  description: 'Entrenador gamificado de 1º ESO',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#main-content">
          SALTAR AL CONTENIDO
        </a>
        <header className="top">
          <Link href="/player" className="logo">
            LEVEL <span>UP</span>
          </Link>

          <nav className="main-nav" aria-label="Navegación principal">
            <Link href="/player">
              🎮 Jugar
            </Link>

            <Link href="/parent">
              👨‍👦 Panel padre
            </Link>
          </nav>
        </header>

        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  )
}
