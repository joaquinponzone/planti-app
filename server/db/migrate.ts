/**
 * Aplica las migraciones pendientes de `server/db/migrations`.
 *
 * Corre en dos lugares: a mano en local (`bun run db:migrate`, que carga `.env`
 * solo) y en el build de Vercel, con las variables del entorno del deploy.
 *
 * A diferencia de `drizzle-kit push`, no deduce el diff mirando el esquema:
 * ejecuta el SQL versionado y anota cada migración en `__drizzle_migrations`.
 * Es idempotente y deja historia. `push` contra producción, nunca: borra
 * columnas sin preguntar.
 */
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { migrate } from "drizzle-orm/libsql/migrator"

import { databaseUrl } from "./url"

/**
 * Host de la base de producción. No es un secreto (sin el token no sirve), y
 * tenerlo escrito acá es lo que permite frenar el error de abajo.
 */
const PRODUCTION_HOST = "planti-joaquinponzone.aws-us-east-1.turso.io"

const url = databaseUrl()

// Un deploy de preview no puede migrar producción: una rama en revisión le
// aplicaría a la base real un esquema que todavía no se mergeó. Pasa cuando
// las credenciales de producción quedan también en el scope Preview de Vercel.
const vercelEnv = process.env.VERCEL_ENV
if (vercelEnv && vercelEnv !== "production" && url.includes(PRODUCTION_HOST)) {
  console.error(
    `\n  ✋ El deploy es \`${vercelEnv}\` pero TURSO_DATABASE_URL apunta a PRODUCCIÓN.\n` +
      "  En el scope Preview de Vercel tiene que ir otra base (o ninguna).\n",
  )
  process.exit(1)
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url))

async function appliedCount(): Promise<number> {
  try {
    const { rows } = await client.execute("SELECT count(*) AS count FROM __drizzle_migrations")
    return Number(rows[0]?.count ?? 0)
  } catch {
    return 0 // base nueva: la tabla de control todavía no existe
  }
}

async function migrationTags(): Promise<string[]> {
  const journal = JSON.parse(
    await readFile(fileURLToPath(new URL("./migrations/meta/_journal.json", import.meta.url)), "utf8"),
  ) as { entries: { tag: string }[] }
  return journal.entries.map((e) => e.tag)
}

// Sin credenciales, para que el log del build diga contra qué base corrió.
console.log(`Migrando ${url.split("?")[0]}${vercelEnv ? ` (${vercelEnv})` : ""}`)

// Función en vez de top-level await: el tsconfig de Next compila a un target
// que no lo admite.
async function main() {
  const before = await appliedCount()
  await migrate(drizzle(client), { migrationsFolder })
  const applied = (await migrationTags()).slice(before)

  if (applied.length === 0) {
    console.log("✓ Sin migraciones pendientes.")
  } else {
    console.log(`✓ ${applied.length} migración(es) aplicada(s):`)
    for (const tag of applied) console.log(`  · ${tag}`)
  }
}

main()
  .catch((error) => {
    console.error("✗ Falló la migración:", error)
    process.exitCode = 1
  })
  .finally(() => client.close())
