# Operación de LEVEL UP v1.0

Este documento describe cómo comprobar, mantener y recuperar la versión familiar estable sin depender de conocimiento no versionado.

## Servicios de producción

- Aplicación: `https://level-up-a544.vercel.app`
- Salud pública: `https://level-up-a544.vercel.app/api/health`
- Código: repositorio privado `Kaizenteambuilding/level-up`, rama `main`
- Datos y autenticación: proyecto Supabase `dtyqebdkgayxufffidef`

El endpoint de salud solo publica estado, versión y commit abreviado. No consulta ni expone información familiar.

## Señales de funcionamiento

Un estado sano exige las cuatro comprobaciones siguientes:

1. GitHub Actions `Quality` termina en verde para el commit de `main`.
2. Vercel marca como correcto el deployment del mismo commit.
3. `/api/health` responde HTTP 200 con `status: ok` y la versión esperada.
4. `database/tests/production_invariants.sql` termina con su aviso explícito de éxito.

GitHub ejecuta `Production health` cada seis horas y también permite lanzarlo manualmente. Un fallo queda visible en Actions sin instalar rastreadores externos ni enviar datos del menor a terceros.

## Publicación normal

1. Mantener todos los cambios revisables en Git.
2. Ejecutar `npm run verify`.
3. Publicar el commit en `main`.
4. Esperar a que GitHub Actions y Vercel estén en verde.
5. Comprobar `/api/health` y, si cambió la persistencia, ejecutar las invariantes de producción.

No se debe publicar si la aplicación compila pero alguna auditoría pedagógica, adaptativa o de integridad falla.

## Incidente de aplicación

Si la web no abre o devuelve errores:

1. Consultar primero `Production health` y el deployment de Vercel.
2. Identificar el último commit que tuvo GitHub Actions y Vercel en verde.
3. Corregir mediante un commit nuevo. No reescribir el historial ni forzar `main`.
4. Si el incidente impide jugar, promover temporalmente en Vercel el último deployment verde.
5. Confirmar después login, apertura de misión y `/api/health`.

## Incidente de datos

Ante una sospecha de datos inconsistentes:

1. Detener cambios de esquema y no editar filas manualmente.
2. Ejecutar `database/tests/production_invariants.sql`, que es de solo lectura.
3. Guardar el resultado y delimitar jugador, sesión y periodo afectados.
4. Antes de corregir datos, obtener una copia o exportación desde Supabase.
5. Aplicar cualquier reparación mediante SQL explícito, acotado y revisable; verificar después las invariantes.

`database/tests/rpc_integrity.sql` crea datos temporales y hace `ROLLBACK`. Sirve para validar las RPC, no para reparar producción.

## Copia y recuperación

La disponibilidad de copias automáticas depende del plan de Supabase. Antes de una migración material:

1. Confirmar en Supabase la política de backups disponible para el proyecto.
2. Exportar al menos esquema y tablas familiares críticas: `families`, `parent_profiles`, `players`, `study_sessions`, `attempts` y `player_skill_state`.
3. Conservar el catálogo y todas las migraciones en Git.
4. Probar la restauración en un proyecto separado antes de considerar válida la copia.

Nunca se debe probar una restauración destructiva sobre producción. Una recuperación termina únicamente cuando pasan las invariantes y un recorrido autenticado completo.

## Cambios de base de datos

- Crear una migración versionada por cambio lógico.
- Probar SQL e invariantes antes de desplegar.
- Revisar asesores de seguridad y rendimiento después de DDL.
- No exponer `service_role` ni secretos en variables `NEXT_PUBLIC_*`.
- Mantener RLS y mínimo privilegio en cualquier tabla del esquema expuesto.

## Revisión periódica

Una vez al mes, o después de cambios importantes:

- Revisar fallos del workflow de salud.
- Ejecutar invariantes de producción.
- Revisar asesores de Supabase.
- Confirmar que dependencias y runtime siguen soportados.
- Completar una misión de prueba y verificar exactamente diez intentos y el XP correspondiente.

La observación pedagógica real de Mati sigue siendo necesaria para valorar claridad, motivación y adecuación del contenido; no bloquea la estabilidad técnica de v1.0.
