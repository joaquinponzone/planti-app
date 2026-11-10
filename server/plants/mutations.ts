import "server-only"

import { and, eq, inArray } from "drizzle-orm"

import { SCHEDULE_FOR_ACTIVITY, type CareActivityType } from "@/lib/care"
import { db } from "@/server/db"
import { careActivities, plants, schedules, users } from "@/server/db/schema"

/**
 * Escrituras de plantas. Igual que las lecturas, todas reciben `userId` y lo
 * ponen en el WHERE: si el id no es de una planta propia, no se toca nada y se
 * devuelve false/null. No hay un "chequear y después escribir" separado que
 * pueda quedar desfasado.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export type PlantFields = {
  name: string
  scientificName: string | null
  location: string | null
  notes: string | null
}

export async function createPlant(userId: string, fields: PlantFields) {
  const [plant] = await db.insert(plants).values({ ...fields, userId }).returning({ id: plants.id })
  return plant
}

export async function updatePlant(userId: string, plantId: string, fields: PlantFields): Promise<boolean> {
  const rows = await db
    .update(plants)
    .set(fields)
    .where(and(eq(plants.id, plantId), eq(plants.userId, userId)))
    .returning({ id: plants.id })
  return rows.length > 0
}

/** Borra la planta; sus cuidados, rutinas y fotos caen en cascada. */
export async function deletePlant(userId: string, plantId: string): Promise<boolean> {
  const rows = await db
    .delete(plants)
    .where(and(eq(plants.id, plantId), eq(plants.userId, userId)))
    .returning({ id: plants.id })
  return rows.length > 0
}

/**
 * Registra un cuidado y, si la planta tiene una rutina de ese tipo, la
 * adelanta: la próxima fecha se cuenta desde hoy.
 */
export async function addCareActivity(
  userId: string,
  plantId: string,
  type: CareActivityType,
  notes: string | null,
  now = new Date(),
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [plant] = await tx
      .select({ id: plants.id })
      .from(plants)
      .where(and(eq(plants.id, plantId), eq(plants.userId, userId)))
    if (!plant) return false

    await tx.insert(careActivities).values({ plantId, type, notes, performedAt: now })

    const [schedule] = await tx
      .select()
      .from(schedules)
      .where(and(eq(schedules.plantId, plantId), eq(schedules.type, SCHEDULE_FOR_ACTIVITY[type])))
    if (schedule) {
      await tx
        .update(schedules)
        .set({ lastPerformedAt: now, nextDueAt: new Date(now.getTime() + schedule.frequencyDays * DAY_MS) })
        .where(eq(schedules.id, schedule.id))
    }
    return true
  })
}

/**
 * Borra un cuidado del historial. La rutina no se recalcula (igual que antes):
 * borrar un registro es corregir el historial, no "deshacer" el cuidado.
 */
export async function removeCareActivity(userId: string, activityId: string): Promise<boolean> {
  const ownPlants = db.select({ id: plants.id }).from(plants).where(eq(plants.userId, userId))
  const rows = await db
    .delete(careActivities)
    .where(and(eq(careActivities.id, activityId), inArray(careActivities.plantId, ownPlants)))
    .returning({ id: careActivities.id })
  return rows.length > 0
}

export async function updateThresholds(userId: string, warningDays: number, dangerDays: number): Promise<void> {
  await db.update(users).set({ warningDays, dangerDays }).where(eq(users.id, userId))
}
