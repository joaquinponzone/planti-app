import { describe, expect, test } from "bun:test"
import { eq } from "drizzle-orm"

import { BackupError, MAX_BACKUP_BYTES, planImport, planImportFromText } from "@/lib/backup"
import { buildExport } from "@/server/backup/export"
import { applyImport } from "@/server/backup/import"
import { db } from "@/server/db"
import { plants, schedules, users } from "@/server/db/schema"
import * as M from "@/server/plants/mutations"
import { getPlant, listPlants } from "@/server/plants/queries"

import realBackup from "./fixtures/backup-real.json"
import { DAY, createUser } from "./helpers"

const fields = (name: string, location: string | null = null) => ({ name, scientificName: null, location, notes: null })

/** Lo que un usuario ve de su cuenta, sin ids ni fechas de creación (que cambian al importar). */
async function snapshot(userId: string) {
  const backup = await buildExport(userId)
  return {
    settings: backup.settings,
    plants: backup.plants
      .map((p) => ({ ...p, id: undefined, createdAt: undefined }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }
}

async function settingsOf(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId))
  return [u.warningDays, u.dangerDays]
}

describe("formato viejo (export de localStorage)", () => {
  test("el backup real se convierte sin avisos", () => {
    const plan = planImport(realBackup)
    expect(plan.format).toBe("legacy")
    expect(plan.warnings).toEqual([])
    expect(plan.settings).toEqual({ warningDays: 14, dangerDays: 30, timezone: null })
    expect(plan.plants).toHaveLength(1)
    expect(plan.plants[0]).toMatchObject({
      sourceId: null, // los ids viejos no sirven para detectar duplicados
      name: "Pandu",
      scientificName: null,
      location: "Living Room",
      archivedAt: null,
      schedules: [],
    })
    expect(plan.plants[0].activities).toEqual([
      { type: "watered", performedAt: new Date("2026-02-23T15:28:48.947Z"), notes: null },
    ])
  })

  test("en una cuenta vacía se importa con sus umbrales, y la app lo muestra", async () => {
    const user = await createUser()
    await M.updateThresholds(user.id, 7, 10)
    const result = await applyImport(db, user.id, planImport(realBackup))
    expect(result).toEqual({ imported: 1, skipped: 0, activities: 1, settingsApplied: true })

    const [pandu] = await listPlants(user.id)
    expect(pandu.name).toBe("Pandu")
    expect(pandu.lastWateredAt).toEqual(new Date("2026-02-23T15:28:48.947Z"))
    expect(await settingsOf(user.id)).toEqual([14, 30])
  })

  const messy = {
    theme: "dark", // claves ajenas de localStorage: se ignoran
    "calendly-store": { state: {} },
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
          { type: "watering", frequency: 7, lastPerformed: "2026-03-01T00:00:00Z", nextDue: "2026-03-08T00:00:00Z", enabled: true },
          { type: "watering", frequency: 5, lastPerformed: "2026-04-01T00:00:00Z", nextDue: "2026-04-06T00:00:00Z", enabled: true },
          { type: "misting", frequency: 0, lastPerformed: "2026-03-01T00:00:00Z", nextDue: "2026-03-01T00:00:00Z" },
        ],
      },
      { id: "2", name: "   " },
      "basura",
    ],
  }

  test("descarta lo inválido, deduplica rutinas y avisa de todo", () => {
    const now = new Date("2026-11-10T12:00:00Z")
    const plan = planImport(messy, now)
    expect(plan.plants).toHaveLength(1)
    const [p] = plan.plants
    expect(p.name).toBe("Monstera")
    expect(p.location).toBeNull()
    expect(p.archivedAt).toEqual(now)
    expect(p.activities).toEqual([
      { type: "fertilized", performedAt: new Date("2026-03-01T10:00:00.000Z"), notes: "NPK" },
      { type: "watered", performedAt: new Date("2026-01-01T10:00:00.000Z"), notes: null }, // desde lastWatered
    ])
    expect(p.schedules).toEqual([
      // de las dos de riego, la del cuidado más reciente
      { type: "watering", frequencyDays: 5, lastPerformedAt: new Date("2026-04-01T00:00:00Z"), nextDueAt: new Date("2026-04-06T00:00:00Z"), enabled: true },
    ])
    expect(plan.settings).toBeNull() // umbrales incoherentes: no se importan

    expect(plan.warnings).toHaveLength(8)
    const all = plan.warnings.join("\n")
    expect(all).toContain("2 foto(s) descartadas")
    expect(all).toContain('rutina "watering" duplicada')
    expect(all).toContain("Umbrales inválidos")
  })

  test("las archivadas se importan pero no aparecen en la lista", async () => {
    const user = await createUser()
    await applyImport(db, user.id, planImport(messy))
    expect(await listPlants(user.id)).toEqual([])
    expect(await db.$count(plants, eq(plants.userId, user.id))).toBe(1)
  })

  test("un backup grande (como el real: 44 plantas, ~15 cuidados cada una) entra completo", async () => {
    const big = {
      plants: Array.from({ length: 44 }, (_, i) => ({
        name: `Potus ${i}`,
        location: ["Living", "Taller", "Comedor"][i % 3],
        careLog: Array.from({ length: 15 }, (_, j) => ({ type: "watered", date: new Date(Date.UTC(2026, 0, 1) + j * 20 * DAY).toISOString() })),
      })),
      plantStatusThresholds: { warningDays: 35, dangerDays: 45 },
    }
    const user = await createUser()
    const result = await applyImport(db, user.id, planImport(big))
    expect(result).toMatchObject({ imported: 44, activities: 660, settingsApplied: true })
    expect(await listPlants(user.id)).toHaveLength(44)
    expect(await settingsOf(user.id)).toEqual([35, 45])
  })
})

describe("exportar e importar (formato v2)", () => {
  async function seededUser() {
    const user = await createUser()
    await M.updateThresholds(user.id, 10, 20)
    const ficus = await M.createPlant(user.id, { name: "Ficus", scientificName: "Ficus lyrata", location: "Living", notes: "Luz indirecta" })
    await M.addCareActivity(user.id, ficus.id, "watered", null, new Date("2026-10-01T10:00:00Z"))
    await M.addCareActivity(user.id, ficus.id, "fertilized", "NPK", new Date("2026-10-05T10:00:00Z"))
    await db.insert(schedules).values({
      plantId: ficus.id,
      type: "watering",
      frequencyDays: 7,
      lastPerformedAt: new Date("2026-10-01T10:00:00Z"),
      nextDueAt: new Date("2026-10-08T10:00:00Z"),
    })
    const old = await M.createPlant(user.id, fields("Cactus viejo"))
    await db.update(plants).set({ archivedAt: new Date("2026-06-01T00:00:00Z") }).where(eq(plants.id, old.id))
    return user
  }

  test("ida y vuelta: exportar una cuenta e importarla en otra deja lo mismo", async () => {
    const ana = await seededUser()
    const text = JSON.stringify(await buildExport(ana.id))

    const bob = await createUser()
    const result = await applyImport(db, bob.id, planImportFromText(text))
    expect(result).toMatchObject({ imported: 2, skipped: 0, activities: 2, settingsApplied: true })

    // timezone es igual porque las dos cuentas tienen el default
    expect(await snapshot(bob.id)).toEqual(await snapshot(ana.id))
    // los ids eran de Ana: Bob recibe ids nuevos
    const anaIds = (await buildExport(ana.id)).plants.map((p) => p.id)
    const bobIds = (await buildExport(bob.id)).plants.map((p) => p.id)
    expect(bobIds.some((id) => anaIds.includes(id))).toBe(false)
  })

  test("importar dos veces el backup de OTRA cuenta tampoco duplica", async () => {
    // Lo atrapó la prueba con el backup real: los ids del archivo son de Ana,
    // así que Bob recibía ids al azar y la segunda vez no los reconocía.
    const ana = await seededUser()
    const text = JSON.stringify(await buildExport(ana.id))
    const bob = await createUser()
    expect((await applyImport(db, bob.id, planImportFromText(text))).imported).toBe(2)
    expect(await applyImport(db, bob.id, planImportFromText(text))).toMatchObject({ imported: 0, skipped: 2 })
    expect(await db.$count(plants, eq(plants.userId, bob.id))).toBe(2)

    // Y el backup de Bob (con sus ids derivados) vuelto a importar en Bob, igual.
    const bobText = JSON.stringify(await buildExport(bob.id))
    expect(await applyImport(db, bob.id, planImportFromText(bobText))).toMatchObject({ imported: 0, skipped: 2 })
  })

  test("importar tu propio backup otra vez no duplica nada", async () => {
    const ana = await seededUser()
    const plan = planImportFromText(JSON.stringify(await buildExport(ana.id)))
    const result = await applyImport(db, ana.id, plan)
    expect(result).toEqual({ imported: 0, skipped: 2, activities: 0, settingsApplied: false })
    expect(await db.$count(plants, eq(plants.userId, ana.id))).toBe(2)
  })

  test("en una cuenta con plantas, agrega pero no pisa los umbrales", async () => {
    const ana = await seededUser()
    const text = JSON.stringify(await buildExport(ana.id))
    const bob = await createUser()
    await M.createPlant(bob.id, fields("La de Bob"))
    await M.updateThresholds(bob.id, 3, 5)

    const result = await applyImport(db, bob.id, planImportFromText(text))
    expect(result.settingsApplied).toBe(false)
    expect(await settingsOf(bob.id)).toEqual([3, 5])
    expect(await db.$count(plants, eq(plants.userId, bob.id))).toBe(3)
  })

  test("el export sólo trae las plantas propias, y nada de la cuenta", async () => {
    const ana = await seededUser()
    const bob = await createUser()
    await M.createPlant(bob.id, fields("Secreta de Bob"))
    const backup = await buildExport(ana.id)
    expect(backup.plants.map((p) => p.name).sort()).toEqual(["Cactus viejo", "Ficus"])
    const text = JSON.stringify(backup)
    expect(text).not.toContain(ana.email)
    expect(text).not.toContain(ana.passwordHash)
  })

  test("si una sentencia falla, no queda nada a medias", async () => {
    const user = await createUser()
    const plan = planImport({ plants: [{ name: "A", careLog: [] }, { name: "B", careLog: [] }] })
    // Una rutina inválida que la conversión nunca generaría: la base la rechaza (CHECK).
    plan.plants[1].schedules.push({ type: "watering", frequencyDays: 0, lastPerformedAt: new Date(), nextDueAt: new Date(), enabled: true })
    await expect(applyImport(db, user.id, plan)).rejects.toThrow()
    expect(await db.$count(plants, eq(plants.userId, user.id))).toBe(0)
  })

  test("una planta repetida dentro del archivo se importa una vez", () => {
    const p = { id: "x", name: "Ficus", activities: [], schedules: [] }
    const plan = planImport({ app: "planti", version: 2, plants: [p, p] })
    expect(plan.plants).toHaveLength(1)
    expect(plan.warnings[0]).toContain("aparece dos veces")
  })
})

describe("archivos que no se aceptan", () => {
  test("no es JSON, no es de Planti, otra versión, o es demasiado grande", () => {
    expect(() => planImportFromText("hola")).toThrow(BackupError)
    expect(() => planImportFromText('{"foo":1}')).toThrow("no parece un backup")
    expect(() => planImportFromText("[]")).toThrow(BackupError)
    expect(() => planImportFromText('{"app":"planti","version":99,"plants":[]}')).toThrow("versión")
    expect(() => planImportFromText(" ".repeat(MAX_BACKUP_BYTES + 1))).toThrow("pesa más")
  })

  test("demasiadas plantas", () => {
    const plants = Array.from({ length: 1001 }, (_, i) => ({ name: `P${i}` }))
    expect(() => planImport({ plants })).toThrow("demasiado grande")
  })
})

test("la planta importada se puede usar como cualquier otra", async () => {
  const user = await createUser()
  await applyImport(db, user.id, planImport(realBackup))
  const [pandu] = await listPlants(user.id)
  expect(await M.addCareActivity(user.id, pandu.id, "watered", null)).toBe(true)
  expect((await getPlant(user.id, pandu.id))?.activities).toHaveLength(2)
})
