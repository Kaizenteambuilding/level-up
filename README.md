# Level Up

Aplicación de repaso adaptativo y gamificado de 1.º de ESO, construida con Next.js, TypeScript y Supabase.

Versión actual: **v1.24.0**. LEVEL UP trabaja con cinco materias activas —Matemáticas, Lengua Castellana y Literatura, Inglés, Geografía e Historia, y Biología y Geología— y mantiene el progreso, la adaptación y las recompensas sincronizados con el estado real del servidor.

Producción: https://level-up-a544.vercel.app

## Recorrido funcional

`/login` → selección del jugador → `/player` → `/mission` → 10 respuestas persistidas → cierre de sesión → dashboard → `/parent`.

La aplicación incluye autenticación real, separación por familia y jugador, reanudación de misiones, motor adaptativo multi-materia, memoria antirrepetición, XP, recompensas, métricas basadas en intentos y panel familiar. El currículo activo contiene 91 habilidades de Matemáticas y 24 habilidades en cada una de las otras cuatro materias, para un total de 187 habilidades activas.

El XP de una misión se mantiene provisional durante los intentos y se consolida exactamente una vez al completar las 10 respuestas. Los reintentos son idempotentes para evitar dobles recompensas o pérdida de progreso ante respuestas de red ambiguas.

## Desarrollo local

Requisitos: Node.js 22.x.

1. Ejecuta `npm install`.
2. Copia `.env.example` a `.env.local`.
3. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Ejecuta `npm run dev`.
5. Abre http://localhost:3000.

La clave pública de Supabase puede utilizarse en el navegador. Nunca añadas una clave `service_role` a una variable `NEXT_PUBLIC_*`.

La aplicación envía CSP, HSTS, políticas de permisos y aislamiento de origen desde `next.config.ts`, y solicita a los buscadores que no indexen las pantallas familiares.

## Base de datos

La base de producción ya está configurada. Los cambios nuevos deben añadirse como migraciones revisables en `database/migrations/` y aplicarse mediante el flujo de migraciones de Supabase.

`lib/database.types.ts` es el contrato TypeScript generado desde el esquema real de Supabase y el cliente de navegador lo utiliza para validar tablas y RPC durante la compilación.

La prueba transaccional `database/tests/rpc_integrity.sql` valida el recorrido completo de escritura y revierte todos los datos temporales al finalizar.

La comprobación de solo lectura `database/tests/production_invariants.sql` detecta sesiones incompletas o duplicadas, intentos sin sesión, misiones cerradas sin diez respuestas y discrepancias de XP sin modificar producción.

`npm run audit:questions` y las auditorías pedagógicas recorren de forma determinista los generadores activos y fallan ante opciones repetidas o de relleno, respuestas inválidas, falta de diversidad, diagnósticos inconsistentes o sesgos de posición.

`npm run audit:adaptive-engine` simula perfiles longitudinales y comprueba cobertura, antirrepetición, dificultad y prioridad adaptativa.

`npm run audit:parent-insights` y `npm run audit:parent-multi-subject` validan que el panel familiar cubra todas las materias activas y no declare fortalezas ni dificultades sin evidencia suficiente.

`npm run audit:mission-recap` y `npm run audit:mission-feedback` protegen el cierre de misión, el progreso guardado y la semántica accesible de éxito y error.

`npm run audit:curriculum-plan`, `npm run audit:multi-subject-curriculum` y las auditorías de generadores por materia protegen planificación, activación y diversidad curricular.

El repositorio contiene 39 migraciones canónicas. La historia de producción capturada en `database/production-migrations.json` contiene 38 migraciones aplicadas y una excepción histórica explícita que nunca se desplegó como migración independiente. `npm run audit:migrations` exige cobertura de procedencia exacta entre repositorio y producción.

El baseline y las pruebas de integridad permiten contrastar el esquema y las invariantes sin escribir datos permanentes en producción. Cualquier ensayo de restauración debe hacerse en un proyecto Supabase separado, nunca sobre producción.

Los avisos de Supabase sobre las RPC públicas `SECURITY DEFINER` son intencionados: las operaciones autenticadas revisadas fijan `search_path`, verifican `auth.uid()` y comprueban pertenencia u ownership. La protección contra contraseñas filtradas sigue siendo una configuración de Auth pendiente de activar desde el panel de Supabase.

## Comprobaciones antes de publicar

GitHub Actions ejecuta automáticamente tipado, auditorías funcionales, seguridad, migraciones, versión, build y dependencias en cada cambio de `main` y en cada pull request.

`npm run verify` agrupa la verificación local completa. El procedimiento de publicación, salud, incidencias, copias y recuperación está en [`OPERATIONS.md`](OPERATIONS.md).

El workflow `Production health` se ejecuta cada seis horas y también puede lanzarse manualmente. Comprueba el endpoint `/api/health`, que la versión y el SHA servido coincidan exactamente con `main`, que `/` y `/login` sigan accesibles y que las cabeceras de seguridad esenciales continúen presentes.

Antes de dar una release por cerrada:

- Ejecutar `npm run verify` y `npm audit --omit=dev --audit-level=high`.
- Confirmar que Quality está en verde para el SHA exacto que se va a publicar.
- Confirmar que el deployment de producción de Vercel corresponde al mismo SHA y está `READY`.
- Confirmar `/api/health` con estado `ok`, versión esperada y prefijo de deployment esperado.
- Revisar los avisos de seguridad y rendimiento de Supabase después de cualquier DDL.
- Realizar un recorrido autenticado real de 10 preguntas cuando se disponga de una sesión de usuario de prueba.
