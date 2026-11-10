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
| 5 | PWA instalable: manifest e íconos (el SW va con las push) | ✅ (falta probar en un celular) | [pwa](2026-11-10-pwa-instalable.md) |
| — | Limpieza antes de `main`: README, CI, `error.tsx`, `packageManager` | ✅ | [limpieza](2026-11-10-limpieza-antes-de-main.md) |
| — | Pasada por el navegador y formularios que no pierden lo escrito | ✅ | [pasada](2026-11-10-pasada-navegador.md) |
| — | Filtro por estado de riego (Peligro, Aviso, Al día) | ✅ | [filtro](2026-11-10-filtro-por-estado.md) |
| — | Ambientes plegables y "Plegar todos" | ✅ | [plegar](2026-11-10-ambientes-plegables.md) |
| — | Importar dos veces un backup viejo ya no duplica | ✅ | [import](2026-11-10-import-sin-duplicados.md) |
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
5. ~~Pasada por el navegador~~ hecha en local ([entrada](2026-11-10-pasada-navegador.md)).
   Falta la misma pasada en el deploy de producción, con Turso y Resend reales.
6. Confirmar que las funciones de Vercel corren en `iad1`, la misma zona que Turso
   (`aws-us-east-1`).

Después de mergear:

1. La usuaria ya tiene su backup (Export de la versión vieja, 44 plantas). Se registra en
   la nueva y lo sube ella desde **Cuenta → Importar un backup**.
2. Si algo falla en la pantalla, el plan B es `bun scripts/import-backup.ts <backup.json>
   <email> --dry-run` contra Turso.

## Después

- **6 · Push.** Acá nace `public/sw.js` (sin handler de `fetch`, ver D-011) y el `badge-96.png` en `bun run icons`. Hoy **no hay pantalla para crear rutinas** (tampoco la había antes:
  `addSchedule` no se llamaba desde ningún lado), así que "Care needed" solo aparece con
  rutinas importadas. La pantalla de rutinas va acá, porque sin rutinas no hay qué
  recordar. La tabla `push_subscriptions` ya existe, atada a `sessionVersion` como en
  futclub. En iOS, las push solo llegan con la PWA instalada (iOS 16.4 o superior).
  El link del aviso puede abrir la lista filtrada: `/?status=danger,warning` (D-013).
  La ruta del cron (`app/api/cron/...`) tiene que volver a quedar afuera del matcher de
  `proxy.ts` y chequear `CRON_SECRET`, que hay que sumar otra vez a `.env.example` (se
  sacaron las dos cosas mientras la ruta no existía).
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

- En dev, error de hidratación en el botón "Cuenta" (el HTML del servidor no lo trae). En
  el build de producción sí lo trae; no se investigó la causa.
- La zona horaria es fija (Buenos Aires) y no hay forma de cambiarla.
