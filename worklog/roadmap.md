# Roadmap

Objetivo de esta etapa: **cuentas con datos en la nube, PWA instalable y avisos push** para
saber cuándo regar.

Actualizado: 2026-11-10

## Estado

| # | Paso | Estado | Entrada |
|---|---|---|---|
| 1 | Base de datos: Turso + Drizzle, esquema, migraciones en el deploy | ✅ | [db](2026-11-10-base-de-datos.md) |
| 2 | Next 16 + React 19 | ✅ | [next 16](2026-11-10-next-16.md) |
| 3 | Auth: registro, login, confirmar email, recuperar contraseña | ✅ | [auth](2026-11-10-auth.md) |
| 4a | Plantas en la base (sin `localStorage`) | ✅ | [plantas](2026-11-10-plantas-en-la-base.md) |
| 4b | Script de importación del backup | ⏳ espera el JSON | — |
| 5 | PWA: manifest y service worker | pendiente | — |
| 6 | Push: VAPID, `web-push`, cron diario, pantalla de rutinas | pendiente | — |
| 7 | Fotos con Vercel Blob | pendiente | — |

## Próximo: 4b, importar el backup

1. La usuaria hace **Export** desde la versión de Planti que está hoy en producción.
2. Se deploya la versión nueva y ella se registra.
3. `bun scripts/import-backup.ts <backup.json> <email> [--dry-run]` contra Turso.

Transformaciones: rutinas duplicadas del mismo tipo → una sola (la del cuidado más
reciente); `lastWatered` sin riego en el historial → un riego con esa fecha; las fotos se
descartan (eran `URL.createObjectURL`, que no sobrevive a recargar); los umbrales se copian
a `users`.

**No deployar a producción antes de tener el backup.** Al deployar, la app pasa a pedir
login y deja de leer `localStorage`.

## Después

- **5 · PWA.** `manifest.webmanifest` e íconos. Service worker sin handler de `fetch`
  (solo push). El proxy ya deja pasar `manifest.webmanifest` y `sw.js`.
- **6 · Push.** Hoy **no hay pantalla para crear rutinas** (tampoco la había antes:
  `addSchedule` no se llamaba desde ningún lado), así que "Care needed" solo aparece con
  rutinas importadas. La pantalla de rutinas va acá, porque sin rutinas no hay qué
  recordar. La tabla `push_subscriptions` ya existe, atada a `sessionVersion` como en
  futclub. En iOS, las push solo llegan con la PWA instalada (iOS 16.4 o superior).
- **7 · Fotos.** Vercel Blob; la tabla `plant_photos` ya existe. La pestaña Photos se sacó
  en el 4a hasta tener la subida real.

## Preguntas abiertas

- **Horario del recordatorio diario.** El plan Hobby de Vercel permite un cron por día, así
  que el aviso llegaría a la misma hora para todos (por ejemplo, 9 AM de Argentina).
  Respetar la hora local de cada usuario requiere el plan Pro o un cron externo. Hay que
  decidirlo antes del paso 6. `users.timezone` y `users.lastReminderOn` ya existen.
- **Export de la cuenta.** Se sacó con el menú Data (D-007). ¿Hace falta una descarga del
  JSON desde el servidor?
- **Borrar la cuenta.** Se mencionó como parte de "pedir lo mínimo" (D-004) y no está
  hecho.

## Limpieza menor

- `package.json` dice `"packageManager": "yarn@1.22.22"`, pero el proyecto usa bun. Hoy no
  rompe nada (Vercel elige por el lockfile), pero contradice al resto.
- No hay suite de tests en el repo. Las pruebas de los pasos 3 y 4a se corrieron con
  `bun test --conditions=react-server` contra bases temporales, desde fuera del repo.
