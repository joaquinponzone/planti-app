# Script de importación del backup y suite de tests

2026-11-10 · rama `feat/cuentas-db`

Decisión: [D-008](decisiones.md#d-008--la-importación-del-backup-es-un-script-no-una-función-de-la-app)

## Por qué

- Los datos de la usuaria están en el `localStorage` de su navegador, y hay que pasarlos a
  su cuenta una sola vez (paso 4b).
- Los tests de los pasos 3 y 4a vivían en una carpeta temporal del sistema y se iban a
  perder. Uno de ellos había atrapado el bug de las subconsultas.

## Qué se hizo

**Importación**
- `scripts/backup-transform.ts`: `planImport`, una función pura que convierte el JSON del
  Export viejo al esquema nuevo. Lo que no encaja se descarta con un aviso en vez de abortar:
  cuidados o rutinas con tipo o fecha inválidos, rutinas duplicadas (queda la del cuidado
  más reciente), frecuencia menor a 1, umbrales incoherentes (quedan los por defecto) y
  fotos (eran URLs temporales). `lastWatered` sin riego en el historial pasa a ser un riego.
- `scripts/import-backup.ts <backup.json> <email> [--dry-run] [--append]`: el usuario tiene
  que existir; si ya tiene plantas, se niega (salvo `--append`), para no duplicar al correrlo
  dos veces; escribe todo en una transacción.

**Tests** (`bun run test`)
- `tests/setup.ts` (preload en `bunfig.toml`) crea una base SQLite temporal, la migra y borra
  `RESEND_API_KEY` antes de cargar cualquier test. Sin eso, bun carga `.env` y los tests
  escribirían en la base configurada ahí y mandarían emails reales (pasó una vez a mano:
  Resend los rechazó).
- `tests/auth.test.ts` y `tests/plants.test.ts`: los 14 tests de los pasos 3 y 4a, portados.
- `tests/import-backup.test.ts`: el backup real (`tests/fixtures/backup-real.json`, una
  planta) y uno armado con todos los casos raros.
- `tests/email.test.ts`: ver el bug de abajo.

## Bug encontrado: links de email en preview

`appUrl()` caía en el dominio de producción si no había `APP_URL`. En un deploy de preview,
el link de "confirmá tu email" llevaba a producción, donde ese token no existe. Ahora en
preview usa `VERCEL_BRANCH_URL`. Por eso `APP_URL`, si se carga, va **solo en Production**.

## Cómo se verificó

- 25 tests en verde; lint, typecheck y build también.
- El script, contra una base temporal: email sin cuenta → error; `--dry-run` no escribe;
  el email se normaliza; la importación real deja a Pandu con su riego del 23/2; la segunda
  corrida se niega; un JSON que no es backup se rechaza.

## Pendiente

- Correrlo en producción con el backup de la usuaria (ver roadmap).
