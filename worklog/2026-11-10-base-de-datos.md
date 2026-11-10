# Base de datos: Turso + Drizzle

2026-11-10 · rama `feat/cuentas-db` · commit `97dbf54`

Decisiones: [D-001](decisiones.md#d-001--turso--drizzle), [D-002](decisiones.md#d-002--desarrollo-contra-una-base-local)

## Por qué

Planti guardaba todo en `localStorage`: sin cuentas, sin sincronizar entre dispositivos y sin
forma de mandar avisos desde un servidor. La base es el primer paso de los tres.

## Qué se hizo

**Esquema** (`server/db/schema.ts`, migración `0000_mysterious_daimon_hellstrom.sql`)
- Cuentas: `users` (con `sessionVersion`, umbrales, `timezone` y `lastReminderOn`),
  `auth_tokens`, `login_attempts` y `push_subscriptions`.
- Plantas: `plants` (`archivedAt` en vez de un booleano), `care_activities` (reemplaza a
  `careLog` y a `lastWatered`), `schedules` (una por tipo y planta, con `nextDueAt`
  indexado para el cron) y `plant_photos`.
- Restricciones CHECK para los tipos y la frecuencia, UNIQUE para rutinas, borrado en
  cascada. IDs UUID y fechas en `timestamp_ms`.

**Conexión y migraciones**
- `server/db/url.ts`: una sola función decide la URL para la app, `migrate.ts` y
  `drizzle.config.ts`. En local cae en `file:local.db`; en Vercel sin la variable falla.
- `server/db/migrate.ts` en el `buildCommand` de `vercel.json`. Muestra en el log contra
  qué base corrió y se niega a migrar producción desde un deploy de preview.

**Dominio**
- `lib/care.ts`: `SCHEDULE_FOR_ACTIVITY`, el mapa explícito entre cuidado y rutina. La
  versión vieja lo derivaba con `` `${type}ing` `` ("watered" → "wateredding"), así que
  solo funcionaban riego y limpieza.

## Cómo se verificó

- Contra la base: se rechazan un tipo de cuidado inexistente, una frecuencia 0 y una
  rutina duplicada; borrar un usuario borra en cascada sus plantas y rutinas.
- `@libsql/client` prende las foreign keys también en archivos locales (sin `PRAGMA`).
- `migrate.ts`: local OK, Turso OK ("sin migraciones pendientes"), preview apuntando a
  producción → exit 1, Vercel sin URL → exit 1.

## Pendiente

- Sin lock para migraciones simultáneas (futclub usa un advisory lock de Postgres). Con el
  tamaño de la app no hace falta; si dos deploys se pisan, se agrega con una tabla.
