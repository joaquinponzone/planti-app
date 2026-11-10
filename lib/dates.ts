/**
 * Fechas para mostrar. Siempre con la zona horaria del usuario (`users.timezone`):
 * las páginas se renderizan primero en el servidor (UTC) y después se hidratan
 * en el navegador, y si cada lado usara su propia zona el texto no coincidiría.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** Fecha calendario (YYYY-MM-DD) de un instante en una zona horaria. */
function calendarDay(date: Date, timeZone: string): string {
  // en-CA formatea como YYYY-MM-DD
  return date.toLocaleDateString("en-CA", { timeZone })
}

/**
 * Días calendario entre `date` y `now` en la zona del usuario. Regar a las
 * 23:00 y mirar a las 08:00 es "ayer", aunque hayan pasado 9 horas.
 */
export function daysAgo(date: Date, now: Date, timeZone: string): number {
  const a = Date.parse(calendarDay(date, timeZone))
  const b = Date.parse(calendarDay(now, timeZone))
  return Math.round((b - a) / DAY_MS)
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

/** "today", "yesterday", "3 days ago". */
export function formatDaysAgo(days: number): string {
  return rtf.format(-days, "day")
}

export function formatDateTime(date: Date, timeZone: string): string {
  return date.toLocaleString("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
