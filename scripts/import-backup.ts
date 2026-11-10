/**
 * Importa un backup a la cuenta de un usuario, desde la terminal.
 *
 *   bun scripts/import-backup.ts <backup.json> <email> [--dry-run]
 *
 * Es la misma importación que hace la app en /import (`lib/backup.ts` +
 * `server/backup/import.ts`). Queda como herramienta de administración, por
 * si alguien no puede hacerlo desde la pantalla.
 *
 * Usa la misma base que la app (`server/db/url.ts`): para producción,
 * descomentar las variables de Turso en `.env` o pasarlas en la línea.
 */
import { readFile } from "node:fs/promises"

import { createClient } from "@libsql/client"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"

import { normalizeEmail } from "@/lib/auth-validation"
import { planImportFromText, type ImportPlan } from "@/lib/backup"
import { applyImport } from "@/server/backup/import"
import * as schema from "@/server/db/schema"
import { databaseUrl } from "@/server/db/url"

function summary(plan: ImportPlan): string {
  const lines = plan.plants.map((p) => {
    const parts = [`${p.activities.length} cuidados`, `${p.schedules.length} rutinas`]
    if (p.archivedAt) parts.push("archivada")
    return `  · ${p.name}${p.location ? ` (${p.location})` : ""}: ${parts.join(", ")}`
  })
  return [
    `Formato ${plan.format}, ${plan.plants.length} planta(s):`,
    ...lines,
    plan.settings
      ? `Umbrales: aviso a los ${plan.settings.warningDays} días, peligro a los ${plan.settings.dangerDays} (sólo si la cuenta está vacía).`
      : "Sin umbrales.",
    ...(plan.warnings.length ? ["Avisos:", ...plan.warnings.map((w) => `  ⚠ ${w}`)] : []),
  ].join("\n")
}

async function main() {
  const args = process.argv.slice(2)
  const flags = new Set(args.filter((a) => a.startsWith("--")))
  const [file, rawEmail] = args.filter((a) => !a.startsWith("--"))
  if (!file || !rawEmail) {
    console.error("Uso: bun scripts/import-backup.ts <backup.json> <email> [--dry-run]")
    process.exit(1)
  }

  const plan = planImportFromText(await readFile(file, "utf8"))
  const url = databaseUrl()
  console.log(`Base: ${url.split("?")[0]}\n`)
  console.log(summary(plan))

  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  const db = drizzle(client, { schema })
  try {
    const email = normalizeEmail(rawEmail)
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email))
    if (!user) throw new Error(`No hay ninguna cuenta con ${email}. Tiene que registrarse antes.`)

    const existing = await db.$count(schema.plants, eq(schema.plants.userId, user.id))
    if (existing > 0) {
      console.log(`\n${email} ya tiene ${existing} planta(s): las que ya estén no se repiten.`)
    }

    if (flags.has("--dry-run")) {
      console.log(`\n--dry-run: no se escribió nada. Destino: ${email}.`)
      return
    }

    const result = await applyImport(db, user.id, plan)
    console.log(
      `\n✓ ${result.imported} planta(s) y ${result.activities} cuidado(s) importados en la cuenta de ${email}.` +
        (result.skipped ? ` ${result.skipped} ya estaban.` : "") +
        (result.settingsApplied ? " Se aplicaron los umbrales del backup." : ""),
    )
  } finally {
    client.close()
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
