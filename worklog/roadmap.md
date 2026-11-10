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
| 4b | Script de importación del backup | ✅ (falta correrlo en producción) | [import y tests](2026-11-10-import-backup-y-tests.md) |
| — | UI en español | ✅ | [ui en español](2026-11-10-ui-en-espanol.md) |
| — | Exportar e importar los datos de la cuenta | ✅ | [exportar e importar](2026-11-10-exportar-importar.md) |
| 5 | PWA: manifest y service worker | pendiente | — |
| 6 | Push: VAPID, `web-push`, cron diario, pantalla de rutinas | pendiente | — |
| 7 | Fotos con Vercel Blob | pendiente | — |

## Próximo: salir a producción

Antes de mergear a `main`:

1. **Vercel, scope Production:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`,
   `RESEND_API_KEY`, `RESEND_FROM_DOMAIN` y, opcional, `APP_URL` (solo acá).
2. **Vercel, scope Preview:** una base aparte (`planti-preview` en Turso), un `AUTH_SECRET`
   **distinto** del de producción (si no, una cookie del preview sirve en producción) y
   Resend. Sin `TURSO_DATABASE_URL` en Preview, el build de cualquier branch falla.
3. **Vercel, scope Development:** vacío. `vercel env pull` lo bajaría a tu `.env`.
4. **Resend:** dominio verificado. Sin eso solo te llegan los emails a vos y nadie más puede
   confirmar su cuenta. Salida de emergencia: `update users set email_verified_at = …`.
5. **Pasada por el navegador** con `bun dev`: regar, cuidados rápidos, diálogo con notas,
   borrar, umbrales, logout. Nada de eso se probó con clics.
6. Confirmar que las funciones de Vercel corren en `iad1`, la misma zona que Turso
   (`aws-us-east-1`).

Después de mergear:

1. La usuaria ya tiene su backup (Export de la versión vieja, 44 plantas). Se registra en
   la nueva y lo sube ella desde **Cuenta → Importar un backup**.
2. Si algo falla en la pantalla, el plan B es `bun scripts/import-backup.ts <backup.json>
   <email> --dry-run` contra Turso.

## Después

- **5 · PWA.** `manifest.webmanifest` e íconos. Service worker sin handler de `fetch`
  (solo push). El proxy ya deja pasar `manifest.webmanifest` y `sw.js`.
- **6 · Push.** Hoy **no hay pantalla para crear rutinas** (tampoco la había antes:
  `addSchedule` no se llamaba desde ningún lado), así que "Care needed" solo aparece con
  rutinas importadas. La pantalla de rutinas va acá, porque sin rutinas no hay qué
  recordar. La tabla `push_subscriptions` ya existe, atada a `sessionVersion` como en
  futclub. En iOS, las push solo llegan con la PWA instalada (iOS 16.4 o superior).
- **7 · Fotos.** Vercel Blob; la tabla `plant_photos` ya existe. La pestaña Photos se sacó
  en el 4a hasta tener la subida real. Ojo: `BLOB_READ_WRITE_TOKEN` (de 2025) está cargado
  en **todos** los entornos de Vercel. Antes de usarlo, separar Preview (otro store o
  ninguno); si no, lo que se sube probando un preview cae en el store de producción.

## Preguntas abiertas

- **Horario del recordatorio diario.** El plan Hobby de Vercel permite un cron por día, así
  que el aviso llegaría a la misma hora para todos (por ejemplo, 9 AM de Argentina).
  Respetar la hora local de cada usuario requiere el plan Pro o un cron externo. Hay que
  decidirlo antes del paso 6. `users.timezone` y `users.lastReminderOn` ya existen.
- **Borrar la cuenta.** Se mencionó como parte de "pedir lo mínimo" (D-004) y no está
  hecho.

## Limpieza menor

- `package.json` dice `"packageManager": "yarn@1.22.22"`, pero el proyecto usa bun. Hoy no
  rompe nada (Vercel elige por el lockfile), pero contradice al resto.
- README desactualizado: dice Next 14 y "local storage", y no menciona Turso, las
  migraciones, `bun run test` ni las variables nuevas.
- Sin CI. Un GitHub Action con lint, typecheck y `bun run test` en cada push.
- La zona horaria es fija (Buenos Aires) y no hay forma de cambiarla.
- Sin `error.tsx`: si Turso no responde, se ve la página de error genérica de Next.
