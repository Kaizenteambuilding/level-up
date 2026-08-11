# LEVEL UP v20 — Next.js real

## Qué incluye
- Next.js App Router
- TypeScript
- Rutas: /login, /player, /mission, /boss, /parent
- Generador matemático integrado
- Motor adaptativo integrado
- Supabase preparado mediante .env
- Esquema SQL inicial

## Puesta en marcha
1. Instala Node.js 20+.
2. `npm install`
3. Copia `.env.example` a `.env.local`
4. Crea un proyecto Supabase.
5. Añade URL y anon key.
6. Ejecuta `database/schema.sql` y `database/seed.sql` en Supabase SQL Editor.
7. `npm run dev`
8. Abre http://localhost:3000

## Siguiente integración
- Supabase Auth real.
- Guardar jugador y mastery.
- Crear sesión en DB.
- Persistir attempts.
- Recalcular `player_skill_state` en una Route Handler/Edge Function.
- Leer panel padre desde datos reales.
