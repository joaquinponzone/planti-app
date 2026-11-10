/**
 * Aplica un plan de importación a la cuenta de un usuario. Sólo agrega:
 * nunca borra ni modifica plantas existentes.
 *
 * Sin `server-only` a propósito: también lo usa `scripts/import-backup.ts`,
 * que corre fuera de Next. Recibe la base por parámetro por la misma razón.
 */
import { createHash } from "node:crypto"

import { eq, inArray } from "drizzle-orm"
import type { LibSQLDatabase } from "drizzle-orm/libsql"

import type { ImportPlan } from "@/lib/backup"
import * as schema from "@/server/db/schema"

const { careActivities, plants, schedules, users } = schema

type Db = LibSQLDatabase<typeof schema>

export type ImportResult = {
  imported: number
  /** Plantas que ya estaban en la cuenta (el archivo se importó antes). */
  skipped: number
  activities: number
  /** Si se aplicaron los umbrales y la zona horaria del backup. */
  settingsApplied: boolean
}

/** SQLite admite 32766 variables por sentencia; 500 filas × 7 columnas queda lejos. */
const CHUNK = 500

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK))
  return out
}

/**
 * Id para una planta cuyo id original ya es de OTRA cuenta (alguien importa
 * el backup de otro). Sale de un hash de la cuenta destino y el id original,
 * así que es siempre el mismo: importar ese archivo una segunda vez en esta
 * cuenta da el mismo id, se reconoce y no duplica. Con un id al azar, cada
 * importación sumaba todas las plantas de nuevo (lo atrapó la prueba con el
 * backup real).
 */
function derivedId(userId: string, sourceId: string): string {
  const h = createHash("sha256").update(`planti-import:${userId}:${sourceId}`).digest("hex")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

const activityKey = (type: string, performedAt: Date) => `${type}@${performedAt.getTime()}`

/**
 * Las plantas de la cuenta con su historial, para reconocer las de un backup
 * legacy (ver `findLegacyMatch`). Incluye las archivadas: también se importan.
 */
async function loadAccountPlants(db: Db, userId: string) {
  const [rows, activities] = await Promise.all([
    db.select({ id: plants.id, name: plants.name, location: plants.location }).from(plants).where(eq(plants.userId, userId)),
    db
      .select({ plantId: careActivities.plantId, type: careActivities.type, performedAt: careActivities.performedAt })
      .from(careActivities)
      .innerJoin(plants, eq(careActivities.plantId, plants.id))
      .where(eq(plants.userId, userId)),
  ])
  const history = new Map<string, Set<string>>()
  for (const a of activities) {
    let keys = history.get(a.plantId)
    if (!keys) history.set(a.plantId, (keys = new Set()))
    keys.add(activityKey(a.type, a.performedAt))
  }
  return rows.map((p) => ({ ...p, history: history.get(p.id) ?? new Set<string>() }))
}

type AccountPlant = Awaited<ReturnType<typeof loadAccountPlants>>[number]

/**
 * Un backup legacy no trae ids útiles (eran `Date.now()` del navegador y no
 * quedan guardados en ningún lado). Sin esto, importar dos veces el mismo
 * archivo duplicaba todas las plantas.
 *
 * Una planta del archivo ya está en la cuenta si hay una con el mismo nombre y
 * ubicación cuyo historial CONTIENE todos sus cuidados (mismo tipo y mismo
 * instante). Contiene y no "es igual": si se regó después de importar, la de
 * la cuenta tiene cuidados de más y tiene que seguir reconociéndose.
 *
 * Cada planta de la cuenta se empareja con una sola del archivo (`used`): dos
 * "Potus" iguales en el archivo necesitan dos en la cuenta para saltearse.
 */
function findLegacyMatch(plant: ImportPlan["plants"][number], account: AccountPlant[], used: Set<string>) {
  return account.find(
    (candidate) =>
      !used.has(candidate.id) &&
      candidate.name === plant.name &&
      candidate.location === plant.location &&
      plant.activities.every((a) => candidate.history.has(activityKey(a.type, a.performedAt))),
  )
}

export async function applyImport(db: Db, userId: string, plan: ImportPlan, now = new Date()): Promise<ImportResult> {
  // Para cada planta de un backup v2 hay dos ids posibles: el original y el
  // derivado. Si cualquiera de los dos ya es de esta cuenta, la planta ya se
  // importó antes y se saltea.
  const sourceIds = plan.plants.map((p) => p.sourceId).filter((id): id is string => id !== null)
  const candidates = sourceIds.flatMap((id) => [id, derivedId(userId, id)])
  const existing = candidates.length
    ? await db.select({ id: plants.id, userId: plants.userId }).from(plants).where(inArray(plants.id, candidates))
    : []
  const ownIds = new Set(existing.filter((p) => p.userId === userId).map((p) => p.id))
  const takenIds = new Set(existing.map((p) => p.id))

  const accountIsEmpty = (await db.$count(plants, eq(plants.userId, userId))) === 0
  const accountPlants = !accountIsEmpty && plan.plants.some((p) => !p.sourceId) ? await loadAccountPlants(db, userId) : []
  const matched = new Set<string>()

  const plantRows: (typeof plants.$inferInsert)[] = []
  const activityRows: (typeof careActivities.$inferInsert)[] = []
  const scheduleRows: (typeof schedules.$inferInsert)[] = []
  let skipped = 0

  for (const p of plan.plants) {
    const derived = p.sourceId ? derivedId(userId, p.sourceId) : null
    if (p.sourceId && (ownIds.has(p.sourceId) || ownIds.has(derived!))) {
      skipped++
      continue
    }
    if (!p.sourceId) {
      const match = findLegacyMatch(p, accountPlants, matched)
      if (match) {
        matched.add(match.id)
        skipped++
        continue
      }
    }
    // Los ids se generan acá (no en la base) para poder armar todas las
    // filas antes de escribir y mandarlas juntas. El formato viejo no trae
    // ids útiles: esas plantas reciben uno al azar.
    const id = !p.sourceId ? crypto.randomUUID() : !takenIds.has(p.sourceId) ? p.sourceId : derived!
    takenIds.add(id)
    plantRows.push({
      id,
      userId,
      name: p.name,
      scientificName: p.scientificName,
      location: p.location,
      notes: p.notes,
      archivedAt: p.archivedAt,
      createdAt: now,
      updatedAt: now,
    })
    for (const a of p.activities) activityRows.push({ ...a, plantId: id, createdAt: now })
    for (const s of p.schedules) scheduleRows.push({ ...s, plantId: id, createdAt: now, updatedAt: now })
  }

  // Los umbrales y la zona horaria del backup sólo se aplican a una cuenta
  // vacía (la primera importación). Si ya tiene plantas, manda lo que
  // configuró el usuario: importar agrega datos, no pisa preferencias.
  const settingsApplied = accountIsEmpty && plan.settings !== null && plantRows.length > 0

  const statements = [
    ...chunks(plantRows).map((rows) => db.insert(plants).values(rows)),
    ...chunks(activityRows).map((rows) => db.insert(careActivities).values(rows)),
    ...chunks(scheduleRows).map((rows) => db.insert(schedules).values(rows)),
    ...(settingsApplied
      ? [
          db
            .update(users)
            .set({
              warningDays: plan.settings!.warningDays,
              dangerDays: plan.settings!.dangerDays,
              ...(plan.settings!.timezone ? { timezone: plan.settings!.timezone } : {}),
            })
            .where(eq(users.id, userId)),
        ]
      : []),
  ]

  // Un único `batch`: un solo viaje a la base, y atómico (si una sentencia
  // falla, no queda nada a medias). Con una consulta por planta, un backup de
  // 44 plantas eran ~90 viajes a Turso: segundos de espera.
  if (statements.length > 0) {
    await db.batch(statements as [(typeof statements)[number], ...(typeof statements)[number][]])
  }

  return { imported: plantRows.length, skipped, activities: activityRows.length, settingsApplied }
}
