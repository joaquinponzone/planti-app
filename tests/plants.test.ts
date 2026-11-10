import { describe, expect, test } from "bun:test"
import { eq } from "drizzle-orm"

import { daysAgo, formatDaysAgo } from "@/lib/dates"
import { CareActivitySchema, PlantSchema, ThresholdsSchema } from "@/lib/plant-validation"
import { db } from "@/server/db"
import { careActivities, plants, schedules, users } from "@/server/db/schema"
import * as M from "@/server/plants/mutations"
import { getPlant, listPlants } from "@/server/plants/queries"

import { DAY, createUser } from "./helpers"

const fields = (name: string) => ({ name, scientificName: null, location: null, notes: null })

describe("aislamiento entre usuarios", () => {
  test("Bob no puede leer ni modificar las plantas de Ana", async () => {
    const ana = await createUser()
    const bob = await createUser()
    const plant = await M.createPlant(ana.id, fields("Monstera"))
    await M.addCareActivity(ana.id, plant.id, "watered", null)
    const [activity] = await db.select().from(careActivities).where(eq(careActivities.plantId, plant.id))

    expect(await getPlant(bob.id, plant.id)).toBeNull()
    expect((await listPlants(bob.id)).map((p) => p.id)).not.toContain(plant.id)
    expect(await M.updatePlant(bob.id, plant.id, fields("Hackeada"))).toBe(false)
    expect(await M.addCareActivity(bob.id, plant.id, "watered", null)).toBe(false)
    expect(await M.removeCareActivity(bob.id, activity.id)).toBe(false)
    expect(await M.deletePlant(bob.id, plant.id)).toBe(false)

    const intact = await getPlant(ana.id, plant.id)
    expect(intact?.name).toBe("Monstera")
    expect(intact?.activities).toHaveLength(1)
  })

  test("la dueña sí puede editar, borrar cuidados y cambiar sus umbrales", async () => {
    const user = await createUser()
    const plant = await M.createPlant(user.id, fields("A"))
    await M.addCareActivity(user.id, plant.id, "watered", null)
    const [activity] = await db.select().from(careActivities).where(eq(careActivities.plantId, plant.id))

    expect(await M.removeCareActivity(user.id, activity.id)).toBe(true)
    expect(await M.updatePlant(user.id, plant.id, { ...fields("B"), location: "Balcón" })).toBe(true)
    expect((await getPlant(user.id, plant.id))?.location).toBe("Balcón")

    await M.updateThresholds(user.id, 5, 9)
    const [updated] = await db.select().from(users).where(eq(users.id, user.id))
    expect([updated.warningDays, updated.dangerDays]).toEqual([5, 9])
  })
})

test("un cuidado adelanta SU rutina (fertilizar incluido: era el bug del mapeo viejo)", async () => {
  const user = await createUser()
  const plant = await M.createPlant(user.id, fields("Ficus"))
  const past = new Date(Date.now() - 30 * DAY)
  await db.insert(schedules).values([
    { plantId: plant.id, type: "fertilization", frequencyDays: 14, lastPerformedAt: past, nextDueAt: past },
    { plantId: plant.id, type: "watering", frequencyDays: 7, lastPerformedAt: past, nextDueAt: past },
  ])

  const now = new Date()
  await M.addCareActivity(user.id, plant.id, "fertilized", "NPK 10-10-10", now)
  const rows = await db.select().from(schedules).where(eq(schedules.plantId, plant.id))
  expect(rows.find((s) => s.type === "fertilization")?.nextDueAt.getTime()).toBe(now.getTime() + 14 * DAY)
  expect(rows.find((s) => s.type === "watering")?.nextDueAt.getTime()).toBe(past.getTime())
  expect((await getPlant(user.id, plant.id))?.activities[0].notes).toBe("NPK 10-10-10")
})

test("listPlants: último riego, needsCare, orden y archivadas", async () => {
  // Esto atrapó el bug de las subconsultas sin tabla: "last watered" salía
  // siempre null y el orden igual daba bien.
  const user = await createUser()
  await M.createPlant(user.id, fields("Nunca regada"))
  const old = await M.createPlant(user.id, fields("Regada hace 10 días"))
  const recent = await M.createPlant(user.id, fields("Regada hoy"))
  const archived = await M.createPlant(user.id, fields("Archivada"))
  await M.addCareActivity(user.id, old.id, "watered", null, new Date(Date.now() - 20 * DAY))
  await M.addCareActivity(user.id, old.id, "watered", null, new Date(Date.now() - 10 * DAY))
  await M.addCareActivity(user.id, old.id, "misted", null, new Date()) // no es un riego
  await M.addCareActivity(user.id, recent.id, "watered", null)
  await db.update(plants).set({ archivedAt: new Date() }).where(eq(plants.id, archived.id))
  await db.insert(schedules).values({
    plantId: recent.id,
    type: "pruning",
    frequencyDays: 30,
    lastPerformedAt: new Date(),
    nextDueAt: new Date(Date.now() - 1000),
  })

  const list = await listPlants(user.id)
  expect(list.map((p) => p.name)).toEqual(["Nunca regada", "Regada hace 10 días", "Regada hoy"])
  expect(list[0].lastWateredAt).toBeNull()
  expect(Math.round((Date.now() - list[1].lastWateredAt!.getTime()) / DAY)).toBe(10)
  expect(list.map((p) => p.needsCare)).toEqual([false, false, true])
})

test("borrar una planta borra en cascada sus cuidados y rutinas", async () => {
  const user = await createUser()
  const plant = await M.createPlant(user.id, fields("Para borrar"))
  await M.addCareActivity(user.id, plant.id, "watered", null)
  await db.insert(schedules).values({
    plantId: plant.id,
    type: "watering",
    frequencyDays: 3,
    lastPerformedAt: new Date(),
    nextDueAt: new Date(),
  })
  expect(await M.deletePlant(user.id, plant.id)).toBe(true)
  expect(await db.$count(careActivities, eq(careActivities.plantId, plant.id))).toBe(0)
  expect(await db.$count(schedules, eq(schedules.plantId, plant.id))).toBe(0)
})

test("daysAgo cuenta días calendario en la zona del usuario", () => {
  const tz = "America/Argentina/Buenos_Aires" // UTC-3
  const now = new Date("2026-11-10T11:00:00Z") // 08:00 local
  expect(daysAgo(new Date("2026-11-10T02:00:00Z"), now, tz)).toBe(1) // 23:00 de ayer: "yesterday" aunque pasaron 9 h
  expect(daysAgo(new Date("2026-11-10T03:30:00Z"), now, tz)).toBe(0) // 00:30 de hoy
  expect(daysAgo(new Date("2026-11-03T20:00:00Z"), now, tz)).toBe(7)
  expect(formatDaysAgo(0)).toBe("today")
  expect(formatDaysAgo(1)).toBe("yesterday")
})

test("validación: textos vacíos pasan a null y los umbrales tienen que tener sentido", () => {
  expect(PlantSchema.parse({ name: "  Pothos ", scientificName: "  ", location: "", notes: null })).toEqual({
    name: "Pothos",
    scientificName: null,
    location: null,
    notes: null,
  })
  expect(PlantSchema.safeParse({ name: "   " }).success).toBe(false)
  expect(ThresholdsSchema.safeParse({ warningDays: "7", dangerDays: "14" }).success).toBe(true)
  expect(ThresholdsSchema.safeParse({ warningDays: "14", dangerDays: "7" }).success).toBe(false)
  expect(CareActivitySchema.safeParse({ plantId: "x", type: "bailar" }).success).toBe(false)
})
