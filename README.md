# Level Up

Aplicación de repaso adaptativo de matemáticas para Mati, construida con Next.js, TypeScript y Supabase.

Producción: https://level-up-a544.vercel.app

## Recorrido funcional

`/login` → selección del jugador → `/player` → `/mission` → 10 respuestas persistidas → cierre de sesión → dashboard → `/parent`.

La aplicación incluye autenticación real, separación por familia y jugador, reanudación de misiones, motor adaptativo, memoria antirrepetición, XP, métricas basadas en intentos y panel familiar. El currículo activo contiene 15 unidades y 91 habilidades de matemáticas de 1.º de ESO.

El nivel numérico se conserva en la base por compatibilidad, pero no se muestra ni se recalcula: todavía no existe una regla pedagógica aprobada para convertir XP en niveles.

## Desarrollo local

Requisitos: Node.js 22 o posterior.

1. Ejecuta `npm install`.
2. Copia `.env.example` a `.env.local`.
3. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Ejecuta `npm run dev`.
5. Abre http://localhost:3000.

La clave pública de Supabase puede utilizarse en el navegador. Nunca añadas una clave `service_role` a una variable `NEXT_PUBLIC_*`.

## Base de datos

La base de producción ya está configurada. Los cambios nuevos deben añadirse como migraciones revisables en `database/migrations/` y aplicarse mediante el flujo de migraciones de Supabase.

`lib/database.types.ts` es el contrato TypeScript generado desde el esquema real de Supabase y el cliente de navegador lo utiliza para validar tablas y RPC durante la compilación.

La prueba transaccional `database/tests/rpc_integrity.sql` valida el recorrido completo de escritura y revierte todos los datos temporales al finalizar.

El catálogo reproducible `database/catalog/active_curriculum.sql` versiona las 15 unidades y 91 habilidades activas, incluidas sus claves de generador, objetivos, prerrequisitos y errores frecuentes.

`npm run audit:questions` genera 113.750 preguntas deterministas y falla si detecta generadores de reserva, opciones repetidas o de relleno, respuestas inválidas o valores numéricos rotos.

`npm run audit:question-quality` vuelve a recorrer 113.750 preguntas y exige determinismo, diversidad mínima de enunciados y familias, etiquetas diagnósticas válidas, textos acotados y un reparto no sesgado de la respuesta correcta entre las cuatro posiciones.

`database/schema.sql` y `database/seed.sql` se conservan únicamente como marcadores históricos y no deben ejecutarse. El esquema inicial antiguo dejó de representar la base real. Antes de crear un Supabase nuevo hace falta versionar un baseline completo de la base actual.

Migraciones versionadas:

- `20260816_harden_attempts_and_abandon_sessions.sql`: protege el registro atómico de intentos, abandona sesiones caducadas e impide más de una sesión abierta por jugador.
- `20260816_harden_legacy_functions.sql`: retira RPC antiguas y restringe helpers internos.
- `20260816_optimize_rls_and_foreign_keys.sql`: optimiza RLS, completa `WITH CHECK` e indexa claves foráneas.
- `20260816_preserve_player_level_in_attempt_rpc.sql`: elimina la fórmula no validada de 500 XP por nivel y endurece la RPC de intentos.
- `20260816_harden_setup_parent_family_rpc.sql`: valida el alta familiar, limita permisos y aísla el `search_path`.
- `20260816_validate_attempt_rpc_inputs.sql`: valida currículo, sesión, contenido y tiempos, y evita que el navegador decida la dificultad o el XP.
- `20260816_server_control_session_completion.sql`: mueve el cierre de misión a una RPC atómica y retira las escrituras directas de XP y sesiones.
- `20260816_mark_unverified_legacy_sessions.sql`: conserva pero aparta de las métricas las sesiones históricas que no tienen intentos verificables.
- `20260816_prevent_duplicate_session_attempts.sql`: impide respuestas duplicadas y aplica invariantes a todos los intentos nuevos.
- `20260816_require_family_setup_rpc.sql`: impide crear o reasignar relaciones familiares directamente y obliga a utilizar la RPC atómica de alta.
- `20260816_open_mission_atomically.sql`: abre o recupera una única misión mediante RPC y serializa accesos simultáneos del mismo jugador.
- `20260816_restrict_table_write_grants.sql`: aplica mínimo privilegio y reserva las escrituras de progreso, sesiones y familia a las RPC protegidas.
- `20260816_create_player_atomically.sql`: valida y crea jugadores mediante una RPC protegida, sin permitir inserciones directas desde el navegador.
- `20260816_unique_player_alias_per_family.sql`: evita alias duplicados dentro de una familia aunque solo cambien mayúsculas o espacios.
- `20260816_bound_attempt_payloads.sql`: limita semillas y metadatos diagnósticos para impedir intentos con cargas anómalas.
- `20260816_complete_data_api_least_privilege.sql`: elimina accesos anónimos a tablas y deja el currículo autenticado en modo de solo lectura.
- `20260816_expire_abandoned_sessions.sql`: cierra cada hora las misiones abiertas durante más de 24 horas, aunque el jugador no vuelva a entrar.
- `20260816_secure_future_data_api_defaults.sql`: deja privados por defecto las futuras tablas, secuencias y funciones hasta que una migración conceda acceso explícito.
- `20260816_revoke_all_future_public_defaults.sql`: completa esa política incluyendo `MAINTAIN` y concesiones directas heredadas de proyectos antiguos.

Los avisos de Supabase sobre las cinco funciones públicas `SECURITY DEFINER` son intencionados: `setup_parent_family`, `create_levelup_player`, `open_levelup_session`, `submit_levelup_attempt` y `complete_levelup_session` solo pueden ejecutarlas usuarios autenticados y verifican `auth.uid()` y la pertenencia familiar. La protección contra contraseñas filtradas no está disponible en el plan Free actual.

## Comprobaciones antes de publicar

GitHub Actions ejecuta automáticamente el tipado y la auditoría completa de generadores en cada cambio de `main` y en cada pull request.

- `npm run lint` (`tsc --noEmit`).
- `npm run audit:questions` y `npm run audit:question-quality`.
- `npm run build`.
- `npm audit`.
- Recorrido autenticado completo de 10 preguntas.
- Confirmar persistencia de 10 intentos y cierre de la sesión.
- Revisar los avisos de seguridad y rendimiento de Supabase después de cualquier DDL.
- Confirmar el estado del deployment de Vercel asociado al commit.
