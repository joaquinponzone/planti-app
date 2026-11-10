/**
 * Convierte un backup de la Planti vieja (el JSON del botón "Export", que
 * volcaba `localStorage` entero) al esquema de la base.
 *
 * Es una función pura, sin base de datos: la usa `import-backup.ts` y se
 * testea sola. Todo lo que no se puede importar tal cual queda anotado en
 * `warnings`, para que se vea en el `--dry-run` antes de escribir nada.
 */
import { z } from "zod"

import {
  CARE_ACTIVITY_TYPES,
  DEFAULT_DANGER_DAYS,
  DEFAULT_WARNING_DAYS,
  SCHEDULE_TYPES,
  type CareActivityType,
  type ScheduleType,
} from "../lib/care"

// El formato viejo es laxo a propósito: viene de un `localStorage` que pudo
// haber tenido cualquier versión de la app. Lo que no encaja se descarta con
// un aviso en vez de abortar todo.
const OldActivity = z.object({ type: z.string(), date: z.string(), notes: z.string().nullish() })
const OldSchedule = z.object({
  type: z.string(),
  frequency: z.number(),
  lastPerformed: z.string(),
  nextDue: z.string(),
  enabled: z.boolean().optional(),
})
const OldPlant = z.object({
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
const OldBackup = z.object({
  plants: z.array(z.unknown()),
  plantStatusThresholds: z.object({ warningDays: z.number(), dangerDays: z.number() }).optional(),
})

export type ImportedPlant = {
  name: string
  scientificName: string | null
  location: string | null
  notes: string | null
  archived: boolean
  activities: { type: CareActivityType; performedAt: Date; notes: string | null }[]
  schedules: {
    type: ScheduleType
    frequencyDays: number
    lastPerformedAt: Date
    nextDueAt: Date
    enabled: boolean
  }[]
  discardedPhotos: number
}

export type ImportPlan = {
  plants: ImportedPlant[]
  thresholds: { warningDays: number; dangerDays: number }
  warnings: string[]
}

const textOrNull = (v: string | null | undefined) => {
  const t = v?.trim()
  return t ? t : null
}

function parseDate(value: string): Date | null {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const isActivityType = (t: string): t is CareActivityType => (CARE_ACTIVITY_TYPES as readonly string[]).includes(t)
const isScheduleType = (t: string): t is ScheduleType => (SCHEDULE_TYPES as readonly string[]).includes(t)

/** Tira error sólo si el archivo no es un backup de Planti. Lo demás son avisos. */
export function planImport(raw: unknown): ImportPlan {
  const backup = OldBackup.safeParse(raw)
  if (!backup.success) {
    throw new Error("Esto no parece un backup de Planti: falta la lista `plants`.")
  }

  const warnings: string[] = []
  const plants: ImportedPlant[] = []

  backup.data.plants.forEach((rawPlant, i) => {
    const parsed = OldPlant.safeParse(rawPlant)
    if (!parsed.success || !parsed.data.name.trim()) {
      warnings.push(`Planta #${i + 1}: formato inválido o sin nombre, se descarta.`)
      return
    }
    const p = parsed.data
    const name = p.name.trim()

    const activities: ImportedPlant["activities"] = []
    for (const rawActivity of p.careLog ?? []) {
      const a = OldActivity.safeParse(rawActivity)
      const date = a.success ? parseDate(a.data.date) : null
      if (!a.success || !date || !isActivityType(a.data.type)) {
        warnings.push(`${name}: un cuidado con tipo o fecha inválidos se descarta.`)
        continue
      }
      activities.push({ type: a.data.type, performedAt: date, notes: textOrNull(a.data.notes) })
    }

    // `lastWatered` existía en el tipo viejo pero la app nunca lo escribía. Si
    // aparece y no hay un riego con esa fecha, se convierte en uno para no
    // perder el dato.
    const lastWatered = p.lastWatered ? parseDate(p.lastWatered) : null
    if (lastWatered && !activities.some((a) => a.type === "watered" && a.performedAt.getTime() === lastWatered.getTime())) {
      activities.push({ type: "watered", performedAt: lastWatered, notes: null })
    }

    // Una rutina por tipo (la base lo exige). Si había varias, queda la del
    // cuidado más reciente.
    const byType = new Map<ScheduleType, ImportedPlant["schedules"][number]>()
    for (const rawSchedule of p.schedules ?? []) {
      const s = OldSchedule.safeParse(rawSchedule)
      const last = s.success ? parseDate(s.data.lastPerformed) : null
      const next = s.success ? parseDate(s.data.nextDue) : null
      const frequency = s.success ? Math.round(s.data.frequency) : 0
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

    const discardedPhotos = p.imageUrls?.length ?? 0
    if (discardedPhotos > 0) {
      warnings.push(`${name}: ${discardedPhotos} foto(s) descartadas (eran URLs temporales del navegador).`)
    }

    plants.push({
      name,
      scientificName: textOrNull(p.scientificName),
      location: textOrNull(p.location),
      notes: textOrNull(p.notes),
      archived: p.archived ?? false,
      activities,
      schedules: [...byType.values()],
      discardedPhotos,
    })
  })

  let thresholds = { warningDays: DEFAULT_WARNING_DAYS, dangerDays: DEFAULT_DANGER_DAYS }
  const t = backup.data.plantStatusThresholds
  if (t) {
    const valid = Number.isInteger(t.warningDays) && Number.isInteger(t.dangerDays) && t.warningDays >= 1 && t.dangerDays > t.warningDays
    if (valid) thresholds = { warningDays: t.warningDays, dangerDays: t.dangerDays }
    else warnings.push(`Umbrales inválidos (${t.warningDays}/${t.dangerDays}), se usan los por defecto.`)
  }

  return { plants, thresholds, warnings }
}
