/**
 * Formato de los backups de Planti y su conversión a un plan de importación.
 *
 * Función pura, sin base de datos ni APIs de servidor: la usan el navegador
 * (para mostrar la vista previa antes de importar), el servidor (que vuelve a
 * convertir todo: lo que manda el navegador no se acepta tal cual) y
 * `scripts/import-backup.ts`.
 *
 * Acepta dos formatos:
 * - **v2**: el que exporta la app (`/api/export`). Cada planta lleva su id,
 *   así que importar dos veces el mismo archivo en la misma cuenta no duplica.
 * - **legacy**: el Export de la Planti vieja, que volcaba `localStorage` entero
 *   (con claves ajenas, como el tema o `calendly-store`). Sus ids eran
 *   `Date.now()`: no sirven para detectar duplicados.
 *
 * Todo lo que no se puede importar tal cual queda en `warnings`, para que se
 * vea antes de confirmar.
 */
import {
  CARE_ACTIVITY_TYPES,
  SCHEDULE_TYPES,
  type CareActivityType,
  type ScheduleType,
} from "./care"
import { z } from "./zod"

export const BACKUP_APP = "planti"
export const BACKUP_VERSION = 2

/** Topes: el archivo viene de afuera. El backup real más grande (44 plantas, 620 cuidados) pesa 97 KB. */
export const MAX_BACKUP_BYTES = 900 * 1024 // por debajo del límite de 1 MB de las Server Actions
export const MAX_IMPORT_PLANTS = 1000
export const MAX_IMPORT_ACTIVITIES = 50_000

export type ImportedPlant = {
  /** Sólo en v2: el id de la planta en la cuenta de origen. */
  sourceId: string | null
  name: string
  scientificName: string | null
  location: string | null
  notes: string | null
  archivedAt: Date | null
  activities: { type: CareActivityType; performedAt: Date; notes: string | null }[]
  schedules: {
    type: ScheduleType
    frequencyDays: number
    lastPerformedAt: Date
    nextDueAt: Date
    enabled: boolean
  }[]
}

export type ImportPlan = {
  format: "v2" | "legacy"
  plants: ImportedPlant[]
  /** null si el backup no traía configuración. */
  settings: { warningDays: number; dangerDays: number; timezone: string | null } | null
  warnings: string[]
}

export class BackupError extends Error {}

const textOrNull = (v: string | null | undefined) => {
  const t = v?.trim()
  return t ? t : null
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const isActivityType = (t: string): t is CareActivityType => (CARE_ACTIVITY_TYPES as readonly string[]).includes(t)
const isScheduleType = (t: string): t is ScheduleType => (SCHEDULE_TYPES as readonly string[]).includes(t)

function validThresholds(t: { warningDays: number; dangerDays: number }) {
  return Number.isInteger(t.warningDays) && Number.isInteger(t.dangerDays) && t.warningDays >= 1 && t.dangerDays > t.warningDays && t.dangerDays <= 365
}

function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/* Lo que se comparte entre formatos                                           */
/* -------------------------------------------------------------------------- */

const RawActivity = z.object({ type: z.string(), date: z.string().optional(), performedAt: z.string().optional(), notes: z.string().nullish() })
const RawSchedule = z.object({
  type: z.string(),
  // legacy: frequency / lastPerformed / nextDue · v2: frequencyDays / lastPerformedAt / nextDueAt
  frequency: z.number().optional(),
  frequencyDays: z.number().optional(),
  lastPerformed: z.string().optional(),
  lastPerformedAt: z.string().optional(),
  nextDue: z.string().optional(),
  nextDueAt: z.string().optional(),
  enabled: z.boolean().optional(),
})

function convertActivities(name: string, raw: unknown[], warnings: string[]) {
  const out: ImportedPlant["activities"] = []
  for (const item of raw) {
    const a = RawActivity.safeParse(item)
    const date = a.success ? parseDate(a.data.performedAt ?? a.data.date) : null
    if (!a.success || !date || !isActivityType(a.data.type)) {
      warnings.push(`${name}: un cuidado con tipo o fecha inválidos se descarta.`)
      continue
    }
    out.push({ type: a.data.type, performedAt: date, notes: textOrNull(a.data.notes) })
  }
  return out
}

/** Una rutina por tipo (la base lo exige). Si había varias, queda la del cuidado más reciente. */
function convertSchedules(name: string, raw: unknown[], warnings: string[]) {
  const byType = new Map<ScheduleType, ImportedPlant["schedules"][number]>()
  for (const item of raw) {
    const s = RawSchedule.safeParse(item)
    const last = s.success ? parseDate(s.data.lastPerformedAt ?? s.data.lastPerformed) : null
    const next = s.success ? parseDate(s.data.nextDueAt ?? s.data.nextDue) : null
    const frequency = s.success ? Math.round(s.data.frequencyDays ?? s.data.frequency ?? 0) : 0
    if (!s.success || !last || !next || !isScheduleType(s.data.type) || frequency < 1) {
      warnings.push(`${name}: una rutina con datos inválidos se descarta.`)
      continue
    }
    const current = byType.get(s.data.type)
    if (current) {
      warnings.push(`${name}: rutina "${s.data.type}" duplicada, queda la más reciente.`)
      if (current.lastPerformedAt >= last) continue
    }
    byType.set(s.data.type, {
      type: s.data.type,
      frequencyDays: frequency,
      lastPerformedAt: last,
      nextDueAt: next,
      enabled: s.data.enabled ?? true,
    })
  }
  return [...byType.values()]
}

/* -------------------------------------------------------------------------- */
/* Formatos                                                                    */
/* -------------------------------------------------------------------------- */

const LegacyPlant = z.object({
  name: z.string(),
  scientificName: z.string().nullish(),
  location: z.string().nullish(),
  notes: z.string().nullish(),
  imageUrls: z.array(z.string()).optional(),
  schedules: z.array(z.unknown()).optional(),
  careLog: z.array(z.unknown()).optional(),
  archived: z.boolean().optional(),
  lastWatered: z.string().nullish(),
})
const LegacyBackup = z.object({
  plants: z.array(z.unknown()),
  plantStatusThresholds: z.object({ warningDays: z.number(), dangerDays: z.number() }).optional(),
})

function planLegacy(raw: unknown, now: Date): ImportPlan {
  const backup = LegacyBackup.parse(raw)
  const warnings: string[] = []
  const plants: ImportedPlant[] = []

  backup.plants.forEach((rawPlant, i) => {
    const parsed = LegacyPlant.safeParse(rawPlant)
    if (!parsed.success || !parsed.data.name.trim()) {
      warnings.push(`Planta #${i + 1}: formato inválido o sin nombre, se descarta.`)
      return
    }
    const p = parsed.data
    const name = p.name.trim()
    const activities = convertActivities(name, p.careLog ?? [], warnings)

    // `lastWatered` existía en el tipo viejo pero la app nunca lo escribía. Si
    // aparece y no hay un riego con esa fecha, pasa a ser uno.
    const lastWatered = parseDate(p.lastWatered)
    if (lastWatered && !activities.some((a) => a.type === "watered" && a.performedAt.getTime() === lastWatered.getTime())) {
      activities.push({ type: "watered", performedAt: lastWatered, notes: null })
    }

    const photos = p.imageUrls?.length ?? 0
    if (photos > 0) warnings.push(`${name}: ${photos} foto(s) descartadas (eran URLs temporales del navegador).`)

    plants.push({
      sourceId: null,
      name,
      scientificName: textOrNull(p.scientificName),
      location: textOrNull(p.location),
      notes: textOrNull(p.notes),
      archivedAt: p.archived ? now : null,
      activities,
      schedules: convertSchedules(name, p.schedules ?? [], warnings),
    })
  })

  let settings: ImportPlan["settings"] = null
  const t = backup.plantStatusThresholds
  if (t && validThresholds(t)) settings = { warningDays: t.warningDays, dangerDays: t.dangerDays, timezone: null }
  else if (t) warnings.push(`Umbrales inválidos (${t.warningDays}/${t.dangerDays}), no se importan.`)

  return { format: "legacy", plants, settings, warnings }
}

const V2Plant = z.object({
  id: z.string().min(1).max(100),
  name: z.string(),
  scientificName: z.string().nullish(),
  location: z.string().nullish(),
  notes: z.string().nullish(),
  archivedAt: z.string().nullish(),
  activities: z.array(z.unknown()),
  schedules: z.array(z.unknown()),
})
const V2Backup = z.object({
  app: z.literal(BACKUP_APP),
  version: z.literal(BACKUP_VERSION),
  settings: z.object({ warningDays: z.number(), dangerDays: z.number(), timezone: z.string().nullish() }).optional(),
  plants: z.array(z.unknown()),
})

function planV2(raw: unknown): ImportPlan {
  const backup = V2Backup.parse(raw)
  const warnings: string[] = []
  const plants: ImportedPlant[] = []
  const seen = new Set<string>()

  backup.plants.forEach((rawPlant, i) => {
    const parsed = V2Plant.safeParse(rawPlant)
    if (!parsed.success || !parsed.data.name.trim()) {
      warnings.push(`Planta #${i + 1}: formato inválido o sin nombre, se descarta.`)
      return
    }
    const p = parsed.data
    const name = p.name.trim()
    if (seen.has(p.id)) {
      warnings.push(`${name}: aparece dos veces en el archivo, se importa una.`)
      return
    }
    seen.add(p.id)
    plants.push({
      sourceId: p.id,
      name,
      scientificName: textOrNull(p.scientificName),
      location: textOrNull(p.location),
      notes: textOrNull(p.notes),
      archivedAt: parseDate(p.archivedAt),
      activities: convertActivities(name, p.activities, warnings),
      schedules: convertSchedules(name, p.schedules, warnings),
    })
  })

  let settings: ImportPlan["settings"] = null
  const s = backup.settings
  if (s && validThresholds(s)) {
    const tz = s.timezone && isValidTimeZone(s.timezone) ? s.timezone : null
    settings = { warningDays: s.warningDays, dangerDays: s.dangerDays, timezone: tz }
  } else if (s) {
    warnings.push(`Umbrales inválidos (${s.warningDays}/${s.dangerDays}), no se importan.`)
  }

  return { format: "v2", plants, settings, warnings }
}

/**
 * Convierte un backup (ya parseado como JSON) en un plan de importación.
 * Tira `BackupError` sólo si el archivo no es un backup de Planti o se pasa de
 * los topes; lo demás son avisos.
 */
export function planImport(raw: unknown, now = new Date()): ImportPlan {
  const isObject = typeof raw === "object" && raw !== null && !Array.isArray(raw)
  const looksV2 = isObject && (raw as Record<string, unknown>).app === BACKUP_APP
  const plan = (() => {
    try {
      return looksV2 ? planV2(raw) : planLegacy(raw, now)
    } catch {
      throw new BackupError(
        looksV2
          ? "El archivo es de Planti pero de una versión que no se puede leer."
          : "Esto no parece un backup de Planti: falta la lista de plantas.",
      )
    }
  })()

  const activities = plan.plants.reduce((n, p) => n + p.activities.length, 0)
  if (plan.plants.length > MAX_IMPORT_PLANTS || activities > MAX_IMPORT_ACTIVITIES) {
    throw new BackupError(
      `El backup es demasiado grande: ${plan.plants.length} plantas y ${activities} cuidados (el máximo es ${MAX_IMPORT_PLANTS} y ${MAX_IMPORT_ACTIVITIES}).`,
    )
  }
  return plan
}

/** Lee el texto de un archivo de backup. Separado de `planImport` para dar un error claro si no es JSON. */
export function planImportFromText(text: string, now = new Date()): ImportPlan {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) {
    throw new BackupError(`El archivo pesa más de ${Math.round(MAX_BACKUP_BYTES / 1024)} KB.`)
  }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError("El archivo no es un JSON válido.")
  }
  return planImport(raw, now)
}
