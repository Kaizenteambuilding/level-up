import SupabaseConnectionTest from '@/components/SupabaseConnectionTest'

export default function ConnectionPage(){
  return <main className="shell">
    <SupabaseConnectionTest/>
    <section className="card">
      <h2>¿Qué estamos comprobando?</h2>
      <p className="muted">
        Esta prueba intenta leer la tabla <b>skills</b> que ya creamos en Supabase.
        Si devuelve datos, la aplicación publicada en Vercel ya está hablando con la base de datos real.
      </p>
    </section>
  </main>
}
