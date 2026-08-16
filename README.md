# Level Up

Aplicación de repaso adaptativo de matemáticas para Mati, construida con Next.js, TypeScript y Supabase.

Producción: https://level-up-a544.vercel.app

## Recorrido funcional

`/login` → selección del jugador → `/player` → `/mission` → 10 respuestas persistidas → cierre de sesión → dashboard → `/parent`.

La aplicación incluye autenticación real, separación por familia y jugador, reanudación de misiones, motor adaptativo, memoria antirrepetición, XP, métricas basadas en intentos y panel familiar.

## Desarrollo local

Requisitos: Node.js 20 o posterior.

1. Ejecuta `npm install`.
2. Copia `.env.example` a `.env.local`.
3. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Ejecuta `npm run dev`.
5. Abre http://localhost:3000.

La clave pública de Supabase puede utilizarse en el navegador. Nunca añadas una clave `service_role` a una variable `NEXT_PUBLIC_*`.

## Base de datos

La base de producción ya está configurada. Los cambios nuevos deben añadirse como migraciones revisables en `database/migrations/` y aplicarse mediante el flujo de migraciones de Supabase.

`database/schema.sql` y `database/seed.sql` se conservan únicamente como marcadores históricos y no deben ejecutarse. El esquema inicial antiguo dejó de representar la base real. Antes de crear un Supabase nuevo hace falta versionar un baseline completo de la base actual.

Migraciones versionadas:

- `20260816_harden_attempts_and_abandon_sessions.sql`: unifica y protege el registro atómico de intentos; recupera o abandona sesiones históricas; impide más de una sesión abierta por jugador.
- `20260816_harden_legacy_functions.sql`: retira RPC antiguas y restringe helpers internos.

## Comprobaciones antes de publicar

- `npm run build`
- Recorrido autenticado completo de 10 preguntas.
- Confirmar persistencia de 10 intentos y cierre de la sesión.
- Revisar los avisos de seguridad y rendimiento de Supabase después de cualquier DDL.
