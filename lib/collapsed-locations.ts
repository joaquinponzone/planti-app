/**
 * Qué ambientes de la lista están plegados. Es una preferencia de pantalla, de
 * cada dispositivo (el celular y la compu pueden tener distinto armado), así
 * que va en una cookie y no en la base.
 *
 * Cookie y no `localStorage`: la lee el servidor (`app/(app)/page.tsx`), así
 * que la página llega ya plegada. Con `localStorage` se vería todo abierto y
 * después se cerraría.
 */
export const COLLAPSED_LOCATIONS_COOKIE = "planti_collapsed"

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Tolera cualquier valor: una cookie rota es "nada plegado", no un error. */
export function parseCollapsedLocations(value: string | undefined): string[] {
  if (!value) return []
  // Next ya decodifica el valor de la cookie; el navegador, no. Se prueban los dos.
  for (const candidate of [value, safeDecode(value)]) {
    try {
      const parsed: unknown = JSON.parse(candidate)
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string")
    } catch {
      // probar el siguiente
    }
  }
  return []
}

/** Sólo en el navegador. */
export function saveCollapsedLocations(locations: Iterable<string>): void {
  const value = encodeURIComponent(JSON.stringify([...locations]))
  document.cookie = `${COLLAPSED_LOCATIONS_COOKIE}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
