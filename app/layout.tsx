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
        <header className="top">
          <Link href="/player" className="logo">
            LEVEL <span>UP</span>
          </Link>

          <nav
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              fontWeight: 800,
            }}
          >
            <Link href="/player">
              🎮 Jugar
            </Link>

            <Link href="/parent">
              👨‍👦 Panel padre
            </Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  )
}
