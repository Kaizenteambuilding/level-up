import './globals.css'
import Link from 'next/link'
export const metadata={title:'LEVEL UP',description:'Entrenador gamificado de 1º ESO'}
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="es"><body>
    <header className="top"><Link href="/" className="logo">LEVEL <span>UP</span></Link><nav><Link href="/player">Jugador</Link> · <Link href="/parent">Padre</Link></nav></header>
    {children}
  </body></html>
}
