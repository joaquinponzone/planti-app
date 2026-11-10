/**
 * A qué base conectarse. Lo usan la app, `migrate.ts` y `drizzle.config.ts`,
 * para que los tres apunten siempre al mismo lado.
 *
 * En local, sin variables, se usa `file:local.db`: el desarrollo nunca toca
 * Turso salvo que se pida explícitamente en `.env`.
 *
 * En Vercel no hay default. Si la variable no llegó al deploy, caer en un
 * archivo local haría que la app arranque "bien" sobre una base vacía y
 * efímera, y nadie se enteraría hasta perder datos.
 */
export const LOCAL_DATABASE_URL = "file:local.db"

export function databaseUrl(): string {
  const url = process.env.TURSO_DATABASE_URL
  if (url) return url

  if (process.env.VERCEL) {
    throw new Error("Falta TURSO_DATABASE_URL en el entorno de Vercel.")
  }
  return LOCAL_DATABASE_URL
}
