import "server-only"

import { asc, eq, inArray } from "drizzle-orm"

import { BACKUP_APP, BACKUP_VERSION } from "@/lib/backup"
import { db } from "@/server/db"
import { careActivities, plants, schedules, users } from "@/server/db/schema"

/**
 * Todos los datos de un usuario, en el formato v2 que entiende `planImport`.
 * Incluye las plantas archivadas: es un backup, no lo que se ve en pantalla.
 * No incluye el email ni nada de la cuenta (contraseña, sesiones, tokens):
 * el archivo se puede importar en cualquier cuenta.
 */
export async function buildExport(userId: string, now = new Date()) {
  const [user] = await db
    .select({ warningDays: users.warningDays, dangerDays: users.dangerDays, timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))

  const ownPlants = await db.select().from(plants).where(eq(plants.userId, userId)).orderBy(asc(plants.createdAt))
  const ids = ownPlants.map((p) => p.id)

  const [activities, plantSchedules] = ids.length
    ? await Promise.all([
        db.select().from(careActivities).where(inArray(careActivities.plantId, ids)).orderBy(asc(careActivities.performedAt)),
        db.select().from(schedules).where(inArray(schedules.plantId, ids)),
      ])
    : [[], []]

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings: user ?? null,
    plants: ownPlants.map((p) => ({
      id: p.id,
      name: p.name,
      scientificName: p.scientificName,
      location: p.location,
      notes: p.notes,
      archivedAt: p.archivedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      activities: activities
        .filter((a) => a.plantId === p.id)
        .map((a) => ({ type: a.type, performedAt: a.performedAt.toISOString(), notes: a.notes })),
      schedules: plantSchedules
        .filter((s) => s.plantId === p.id)
        .map((s) => ({
          type: s.type,
          frequencyDays: s.frequencyDays,
          lastPerformedAt: s.lastPerformedAt.toISOString(),
          nextDueAt: s.nextDueAt.toISOString(),
          enabled: s.enabled,
        })),
    })),
  }
}
