# Limpieza antes de mergear a main

2026-11-10 · rama `feat/cuentas-db`

## Por qué

En la revisión de la rama antes de pasarla a `main` quedaron cuatro detalles de "Limpieza
menor" del roadmap. Ninguno bloqueaba, pero contradecían al resto del proyecto o dejaban
una pantalla en inglés.

## Qué se hizo

- `package.json`: `packageManager` pasa de `yarn@1.22.22` a `bun@1.3.5`, la versión que se
  usa en local. Se suma `bun run typecheck` (`next typegen && tsc --noEmit -p .`).
- `README.md` reescrito en español: stack actual (Next 16, Turso, auth propia, Resend),
  desarrollo local sin variables, tabla de variables por entorno, scripts, estructura.
- `.env.example` sin `CRON_SECRET`, y `proxy.ts` sin la excepción de `api/cron`. La ruta
  no existe todavía. Dejar pública una ruta que no existe no rompía nada, pero el día que
  alguien creara algo bajo `/api/cron` iba a quedar sin sesión sin que nadie lo decidiera.
  Vuelven las dos en el paso 6, junto con la ruta y su chequeo de `CRON_SECRET`.
- `app/error.tsx`: pantalla de error en español ("Algo salió mal" + "Reintentar" con
  `retry()`), con el mismo estilo que `not-found.tsx`. Va en `app/` y no en `app/(app)/`
  porque un `error.tsx` no envuelve al layout de su mismo segmento, y es
  `app/(app)/layout.tsx` el que consulta la base. Muestra el `digest` para buscar el
  error en los logs de Vercel; el mensaje real no llega al navegador en producción.
- `.github/workflows/ci.yml`: lint, typecheck y tests en cada PR y en cada push a `main`.
  No necesita secretos: los tests usan su propia base SQLite.

## Cómo se verificó

- `bun run lint`, `bun run typecheck`, `bun run test` (37 pass) y `bun run build`.
- Los mismos pasos que el CI en un `git clone` limpio (sin `.next` ni `next-env.d.ts`):
  `bun install --frozen-lockfile`, lint, typecheck y tests, todo en verde.
- `error.tsx`: build de producción con `TURSO_DATABASE_URL` apuntando a un puerto cerrado
  y una cookie de sesión válida. `/` responde 500, el HTML trae el `digest` y carga el
  chunk que tiene "Algo salió mal". **No se miró en un navegador**: Next pinta el error
  boundary del lado del cliente, y eso no se vio con los ojos.
- El workflow de GitHub Actions no corrió todavía: corre la primera vez que se pushee.
