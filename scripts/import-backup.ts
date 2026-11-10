/**
 * Importa un backup de la Planti vieja a la cuenta de un usuario.
 *
 *   bun scripts/import-backup.ts <backup.json> <email> [--dry-run]
 *
 * - El usuario tiene que existir (registrarse antes).
 * - Si la cuenta ya tiene plantas, no hace nada: correrlo dos veces
 *   duplicaría todo. Para agregar igual, pasar `--append`.
 * - Todo va en una sola transacción: o entra el backup entero, o nada.
 * - Usa la misma base que la app (`server/db/url.ts`): para producción,
 *   descomentar las variables de Turso en `.env` o pasarlas en la línea.
 */
import { readFile } from "node:fs/promises"

import { createClient } from "@libsql/client"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"

import { normalizeEmail } from "../lib/auth-validation"
import * as schema from "../server/db/schema"
import { databaseUrl } from "../server/db/url"

import { planImport, type ImportPlan } from "./backup-transform"

const { users, plants, careActivities, schedules } = schema
type Db = ReturnType<typeof drizzle<typeof schema>>

/** Escribe el plan en la base. Exportado para los tests. */
export async function applyImport(db: Db, userId: string, plan: ImportPlan, now = new Date()) {
  await db.transaction(async (tx) => {
    for (const p of plan.plants) {
      const [plant] = await tx
        .insert(plants)
        .values({
          userId,
          name: p.name,
          scientificName: p.scientificName,
          location: p.location,
          notes: p.notes,
          archivedAt: p.archived ? now : null,
        })
        .returning({ id: plants.id })

      if (p.activities.length) {
        await tx.insert(careActivities).values(p.activities.map((a) => ({ ...a, plantId: plant.id })))
      }
      if (p.schedules.length) {
        await tx.insert(schedules).values(p.schedules.map((s) => ({ ...s, plantId: plant.id })))
      }
    }
    await tx.update(users).set(plan.thresholds).where(eq(users.id, userId))
  })
}

function summary(plan: ImportPlan): string {
  const lines = plan.plants.map((p) => {
    const parts = [`${p.activities.length} cuidados`, `${p.schedules.length} rutinas`]
    if (p.archived) parts.push("archivada")
    return `  · ${p.name}${p.location ? ` (${p.location})` : ""}: ${parts.join(", ")}`
  })
  return [
    `${plan.plants.length} planta(s):`,
    ...lines,
    `Umbrales: aviso a los ${plan.thresholds.warningDays} días, peligro a los ${plan.thresholds.dangerDays}.`,
    ...(plan.warnings.length ? ["Avisos:", ...plan.warnings.map((w) => `  ⚠ ${w}`)] : []),
  ].join("\n")
}

async function main() {
  const args = process.argv.slice(2)
  const flags = new Set(args.filter((a) => a.startsWith("--")))
  const [file, rawEmail] = args.filter((a) => !a.startsWith("--"))
  if (!file || !rawEmail) {
    console.error("Uso: bun scripts/import-backup.ts <backup.json> <email> [--dry-run] [--append]")
    process.exit(1)
  }

  const plan = planImport(JSON.parse(await readFile(file, "utf8")))
  const url = databaseUrl()
  console.log(`Base: ${url.split("?")[0]}\n`)
  console.log(summary(plan))

  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  const db = drizzle(client, { schema })
  try {
    const email = normalizeEmail(rawEmail)
    const [user] = await db.select().from(users).where(eq(users.email, email))
    if (!user) throw new Error(`No hay ninguna cuenta con ${email}. Tiene que registrarse antes.`)

    const existing = await db.$count(plants, eq(plants.userId, user.id))
    if (existing > 0 && !flags.has("--append")) {
      throw new Error(`${email} ya tiene ${existing} planta(s). Si querés agregar igual, pasá --append.`)
    }

    if (flags.has("--dry-run")) {
      console.log(`\n--dry-run: no se escribió nada. Destino: ${email}.`)
      return
    }

    await applyImport(db, user.id, plan)
    console.log(`\n✓ Importado en la cuenta de ${email}.`)
  } finally {
    client.close()
  }
}

// Sólo corre como comando; importado desde los tests, no hace nada.
if (import.meta.main) {
  main().catch((error) => {
    console.error(`\n✗ ${error instanceof Error ? error.message : error}`)
    process.exitCode = 1
  })
}
