# Planti

App para cuidar plantas: anotar cuándo se regó, fertilizó o trasplantó cada una y ver
cuáles hace mucho que no se riegan. Cada persona tiene su cuenta y sus datos viven en la
nube. Se puede instalar como app (PWA).

## Stack

- Next.js 16 (App Router, Server Actions) y React 19
- Turso (libSQL) con Drizzle ORM y migraciones versionadas
- Auth propia: email y contraseña, sesión en un JWT firmado (`jose`), contraseñas con bcrypt
- Resend para los emails (confirmar cuenta, recuperar contraseña)
- Tailwind CSS con componentes de Radix/shadcn
- bun para instalar, correr scripts y testear
- Deploy en Vercel

## Desarrollo local

```bash
bun install
cp .env.example .env   # todo puede quedar vacío en local
bun run db:migrate     # crea local.db
bun dev
```

Sin variables, la app usa `file:local.db` y los links de los emails se imprimen en la
consola en vez de mandarse. Para registrarte, abrí el link de confirmación que aparece ahí.

## Variables de entorno

Ver [`.env.example`](.env.example).

| Variable | Local | Vercel |
|---|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | opcionales (sin ellas, `local.db`) | obligatorias |
| `AUTH_SECRET` | opcional | obligatoria, 32 caracteres o más |
| `RESEND_API_KEY`, `RESEND_FROM_DOMAIN` | opcionales (sin ellas, consola) | obligatorias |
| `APP_URL` | opcional | opcional (por defecto, el dominio de producción) |

En Vercel, Preview necesita su propia base y su propio `AUTH_SECRET`, distintos de los de
producción. `bun run db:migrate` frena el build si un preview apunta a la base de producción.

## Scripts

| Comando | Qué hace |
|---|---|
| `bun dev` | Servidor de desarrollo |
| `bun run build` | Build de producción |
| `bun run lint` | ESLint |
| `bun run typecheck` | Genera los tipos de rutas de Next y corre `tsc` |
| `bun run test` | Tests, contra una base SQLite temporal (nunca la de `.env`) |
| `bun run db:generate` | Genera una migración a partir de `server/db/schema.ts` |
| `bun run db:migrate` | Aplica las migraciones pendientes |
| `bun run db:studio` | Drizzle Studio |
| `bun run icons` | Regenera los íconos de la PWA |

En Vercel, el build corre `db:migrate` antes de `next build` (ver `vercel.json`). Contra
producción se usan siempre migraciones, nunca `drizzle-kit push`.

CI (GitHub Actions) corre lint, typecheck y tests en cada PR y en cada push a `main`.

## Estructura

```
app/
  (app)/          pantallas con sesión: plantas, detalle, editar, importar
  (auth)/         login, registro, confirmar email, recuperar contraseña
  api/export/     descarga del backup de la cuenta
components/       UI (componentes de shadcn en components/ui)
lib/              código compartido: validaciones, fechas, etiquetas, backup
server/
  auth/           sesión, JWT, tokens de email, límite de intentos
  db/             esquema, conexión y migraciones
  plants/         lecturas y escrituras, siempre filtradas por usuario
  backup/         exportar e importar
scripts/          importar un backup desde la terminal, generar íconos
tests/            tests de bun
proxy.ts          manda al login a quien no tiene sesión
worklog/          roadmap, decisiones y bitácora del proyecto
```

## Convenciones

La UI está en español rioplatense; lo que se guarda en la base, en inglés. Ver
[`AGENTS.md`](AGENTS.md) y [`worklog/decisiones.md`](worklog/decisiones.md).
