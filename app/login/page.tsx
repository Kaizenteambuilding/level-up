export default function Login(){
  return <main className="shell"><section className="card">
    <span className="tag">ACCESO</span><h1>Padre / madre</h1>
    <p className="muted">La autenticación real quedará conectada a Supabase Auth mediante las variables de entorno.</p>
    <label>Email<input style={{width:'100%',padding:12,marginTop:6}} placeholder="tu@email.com"/></label>
    <br/><br/><label>Contraseña<input type="password" style={{width:'100%',padding:12,marginTop:6}}/></label>
  </section></main>
}
