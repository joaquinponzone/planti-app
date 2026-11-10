/**
 * Preload de `bun test` (ver `bunfig.toml`). Corre antes de cargar cualquier
 * test, así que pisa las variables ANTES de que algún módulo abra la base.
 *
 * bun carga `.env` solo: sin esto, los tests escribirían en la base que tenga
 * configurada `.env` (incluso Turso de producción) y mandarían emails reales.
 */
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { migrate } from "drizzle-orm/libsql/migrator"

const dir = mkdtempSync(join(tmpdir(), "planti-test-"))
process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db")}`
delete process.env.TURSO_AUTH_TOKEN
delete process.env.RESEND_API_KEY // los emails se imprimen en consola (ver server/auth/email.ts)
delete process.env.VERCEL

const client = createClient({ url: process.env.TURSO_DATABASE_URL })
await migrate(drizzle(client), { migrationsFolder: join(import.meta.dir, "../server/db/migrations") })
client.close()
