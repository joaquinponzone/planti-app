/**
 * Tipos de cuidado y su relación con las rutinas.
 *
 * Vive fuera del esquema porque lo usan tanto el servidor como los componentes
 * del cliente, y `server/db` no tiene que llegar nunca al bundle del navegador.
 */

export const CARE_ACTIVITY_TYPES = [
  "watered",
  "medicated",
  "fertilized",
  "misted",
  "wiped",
  "moved",
  "repotted",
  "pruned",
] as const
export type CareActivityType = (typeof CARE_ACTIVITY_TYPES)[number]

export const SCHEDULE_TYPES = [
  "watering",
  "medication",
  "fertilization",
  "misting",
  "wiping",
  "moving",
  "repotting",
  "pruning",
] as const
export type ScheduleType = (typeof SCHEDULE_TYPES)[number]

/**
 * Qué rutina avanza cuando se registra cada cuidado.
 *
 * Es un mapa explícito a propósito. La versión en localStorage lo derivaba con
 * `${type}ing` ("watered" → "wateredding"), que no coincide con ninguna rutina:
 * sólo andaban riego y limpieza, que tenían un caso especial. Fertilizar,
 * pulverizar o trasplantar nunca movían su próxima fecha.
 */
export const SCHEDULE_FOR_ACTIVITY: Record<CareActivityType, ScheduleType> = {
  watered: "watering",
  medicated: "medication",
  fertilized: "fertilization",
  misted: "misting",
  wiped: "wiping",
  moved: "moving",
  repotted: "repotting",
  pruned: "pruning",
}

/**
 * Etiquetas en pantalla. El dominio habla inglés (lo que se guarda) y la
 * pantalla habla español: la traducción pasa sólo por acá. Si un valor en
 * inglés llega a la pantalla, es un bug.
 *
 * Son sustantivos ("Riego", no "Regada") porque sirven igual en el botón
 * para registrarlo y en el historial. `Record<…>` hace que agregar un tipo
 * sin etiqueta no compile.
 */
export const CARE_ACTIVITY_LABELS: Record<CareActivityType, string> = {
  watered: "Riego",
  medicated: "Tratamiento",
  fertilized: "Fertilización",
  misted: "Pulverización",
  wiped: "Limpieza de hojas",
  moved: "Cambio de lugar",
  repotted: "Trasplante",
  pruned: "Poda",
}

export const DEFAULT_WARNING_DAYS = 14
export const DEFAULT_DANGER_DAYS = 30

/**
 * Estado de riego de una planta según los umbrales del usuario. Es lo que
 * pinta la tarjeta y lo que filtra la lista (`?status=danger,warning`).
 *
 * El orden es el de los chips del filtro: lo urgente primero.
 */
export const WATERING_STATUSES = ["danger", "warning", "ok"] as const
export type WateringStatus = (typeof WATERING_STATUSES)[number]

/** Los mismos nombres que los umbrales en "Configurar alertas". */
export const WATERING_STATUS_LABELS: Record<WateringStatus, string> = {
  danger: "Peligro",
  warning: "Aviso",
  ok: "Al día",
}

export type Thresholds = { warningDays: number; dangerDays: number }

/**
 * `null` si nunca se regó: no hay con qué medir. La tarjeta la pinta como
 * "ok" (sin alerta, como antes), pero el filtro no la cuenta como "Al día":
 * no está al día, no tiene datos. Sólo aparece sin filtro.
 */
export function getWateringStatus(daysSinceLastWatered: number | null, thresholds: Thresholds): WateringStatus | null {
  if (daysSinceLastWatered === null) return null
  if (daysSinceLastWatered >= thresholds.dangerDays) return "danger"
  if (daysSinceLastWatered >= thresholds.warningDays) return "warning"
  return "ok"
}

/** Lee `?status=` tolerando basura: lo que no es un estado conocido se ignora. */
export function parseWateringStatuses(param: string | null): WateringStatus[] {
  if (!param) return []
  const requested = new Set(param.split(","))
  return WATERING_STATUSES.filter((s) => requested.has(s))
}
