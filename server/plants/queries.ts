import "server-only"

import { and, asc, desc, eq, isNull, sql, type AnyColumn } from "drizzle-orm"

import { db } from "@/server/db"
import { careActivities, plants, schedules } from "@/server/db/schema"

/**
 * Lecturas de plantas. Todas reciben `userId` y filtran por él: una planta de
 * otro usuario no "existe" para quien pregunta. Nunca se llaman con un id que
 * venga del cliente sin ese filtro.
 */

export type PlantSummary = {
  id: string
  name: string
  location: string | null
  lastWateredAt: Date | null
  /** Alguna rutina activa ya venció. */
  needsCare: boolean
}

/**
 * Columna con su tabla adelante (`"plants"."id"`).
 *
 * Dentro de un `select`, Drizzle escribe las columnas sin la tabla. En una
 * subconsulta correlacionada eso cambia el significado: `"plant_id" = "id"`
 * compara contra el `id` de la tabla INTERNA, no el de `plants`, y la
 * subconsulta devuelve siempre null sin ningún error.
 */
function qualified(table: AnyColumn["table"], column: AnyColumn) {
  return sql`${table}.${sql.identifier(column.name)}`
}

export async function listPlants(userId: string): Promise<PlantSummary[]> {
  const now = Date.now()
  const plantId = qualified(plants, plants.id)

  const lastWatered = sql<number | null>`(
    select max(${qualified(careActivities, careActivities.performedAt)}) from ${careActivities}
    where ${qualified(careActivities, careActivities.plantId)} = ${plantId}
      and ${qualified(careActivities, careActivities.type)} = 'watered'
  )`
  const dueSchedules = sql<number>`(
    select count(*) from ${schedules}
    where ${qualified(schedules, schedules.plantId)} = ${plantId}
      and ${qualified(schedules, schedules.enabled)} = 1
      and ${qualified(schedules, schedules.nextDueAt)} <= ${now}
  )`

  const rows = await db
    .select({ id: plants.id, name: plants.name, location: plants.location, lastWatered, dueSchedules })
    .from(plants)
    .where(and(eq(plants.userId, userId), isNull(plants.archivedAt)))
    // Las que hace más tiempo que no se riegan (o nunca), primero.
    .orderBy(sql`${lastWatered} is not null`, asc(lastWatered), asc(plants.createdAt))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    location: r.location,
    // Las subconsultas crudas devuelven el entero, no el `Date` del mapeo de la columna.
    lastWateredAt: r.lastWatered === null ? null : new Date(r.lastWatered),
    needsCare: r.dueSchedules > 0,
  }))
}

export async function getPlant(userId: string, plantId: string) {
  const [plant] = await db
    .select()
    .from(plants)
    .where(and(eq(plants.id, plantId), eq(plants.userId, userId)))
    .limit(1)
  if (!plant) return null

  const [activities, plantSchedules] = await Promise.all([
    db
      .select()
      .from(careActivities)
      .where(eq(careActivities.plantId, plant.id))
      .orderBy(desc(careActivities.performedAt)),
    db.select().from(schedules).where(eq(schedules.plantId, plant.id)),
  ])

  return { ...plant, activities, schedules: plantSchedules }
}

export type PlantDetail = NonNullable<Awaited<ReturnType<typeof getPlant>>>
