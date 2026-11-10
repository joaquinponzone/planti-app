import { describe, expect, test } from "bun:test"
import { eq } from "drizzle-orm"

import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { getPlant, listPlants } from "@/server/plants/queries"

import { planImport } from "../scripts/backup-transform"
import { applyImport } from "../scripts/import-backup"
import realBackup from "./fixtures/backup-real.json"
import { createUser } from "./helpers"

describe("backup real (export del navegador, 2026-11-10)", () => {
  test("se transforma sin avisos", () => {
    const plan = planImport(realBackup)
    expect(plan.warnings).toEqual([])
    expect(plan.thresholds).toEqual({ warningDays: 14, dangerDays: 30 })
    expect(plan.plants).toHaveLength(1)
    expect(plan.plants[0]).toMatchObject({
      name: "Pandu",
      scientificName: null, // "" pasa a null
      location: "Living Room",
      notes: null,
      archived: false,
      schedules: [],
      discardedPhotos: 0,
    })
    expect(plan.plants[0].activities).toEqual([
      { type: "watered", performedAt: new Date("2026-02-23T15:28:48.947Z"), notes: null },
    ])
  })

  test("se importa y la app lo muestra", async () => {
    const user = await createUser()
    await applyImport(db, user.id, planImport(realBackup))

    const [pandu] = await listPlants(user.id)
    expect(pandu.name).toBe("Pandu")
    expect(pandu.location).toBe("Living Room")
    expect(pandu.lastWateredAt).toEqual(new Date("2026-02-23T15:28:48.947Z"))

    const detail = await getPlant(user.id, pandu.id)
    expect(detail?.activities).toHaveLength(1)
    const [updated] = await db.select().from(users).where(eq(users.id, user.id))
    expect([updated.warningDays, updated.dangerDays]).toEqual([14, 30])
  })
})

describe("casos raros", () => {
  const messy = {
    theme: "dark", // otras claves de localStorage: se ignoran
    plantStatusThresholds: { warningDays: 20, dangerDays: 10 }, // incoherentes
    plants: [
      {
        id: "1",
        name: "  Monstera  ",
        location: "",
        imageUrls: ["blob:http://localhost/1", "blob:http://localhost/2"],
        lastWatered: "2026-01-01T10:00:00.000Z", // sin riego en el historial
        archived: true,
        careLog: [
          { id: "a", type: "fertilized", date: "2026-03-01T10:00:00.000Z", notes: " NPK " },
          { id: "b", type: "bailar", date: "2026-03-02T10:00:00.000Z" },
          { id: "c", type: "watered", date: "no-es-fecha" },
        ],
        schedules: [
          { id: "s1", type: "watering", frequency: 7, lastPerformed: "2026-03-01T00:00:00Z", nextDue: "2026-03-08T00:00:00Z", enabled: true },
          { id: "s2", type: "watering", frequency: 5, lastPerformed: "2026-04-01T00:00:00Z", nextDue: "2026-04-06T00:00:00Z", enabled: true },
          { id: "s3", type: "misting", frequency: 0, lastPerformed: "2026-03-01T00:00:00Z", nextDue: "2026-03-01T00:00:00Z" },
        ],
      },
      { id: "2", name: "   " },
      "basura",
    ],
  }

  test("descarta lo inválido, deduplica rutinas y avisa de todo", () => {
    const plan = planImport(messy)
    expect(plan.plants).toHaveLength(1)
    const [p] = plan.plants

    expect(p.name).toBe("Monstera")
    expect(p.location).toBeNull()
    expect(p.archived).toBe(true)
    expect(p.discardedPhotos).toBe(2)
    expect(p.activities).toEqual([
      { type: "fertilized", performedAt: new Date("2026-03-01T10:00:00.000Z"), notes: "NPK" },
      { type: "watered", performedAt: new Date("2026-01-01T10:00:00.000Z"), notes: null }, // desde lastWatered
    ])
    expect(p.schedules).toEqual([
      // de las dos de riego, la del cuidado más reciente
      { type: "watering", frequencyDays: 5, lastPerformedAt: new Date("2026-04-01T00:00:00Z"), nextDueAt: new Date("2026-04-06T00:00:00Z"), enabled: true },
    ])
    expect(plan.thresholds).toEqual({ warningDays: 14, dangerDays: 30 }) // los por defecto

    expect(plan.warnings).toHaveLength(8)
    expect(plan.warnings.join("\n")).toContain("2 foto(s) descartadas")
    expect(plan.warnings.join("\n")).toContain('rutina "watering" duplicada')
    expect(plan.warnings.join("\n")).toContain("Umbrales inválidos")
  })

  test("las plantas archivadas se importan pero no aparecen en la lista", async () => {
    const user = await createUser()
    await applyImport(db, user.id, planImport(messy))
    expect(await listPlants(user.id)).toEqual([])
  })

  test("un archivo que no es un backup se rechaza entero", () => {
    expect(() => planImport({ foo: 1 })).toThrow("no parece un backup")
    expect(() => planImport([])).toThrow()
  })
})
