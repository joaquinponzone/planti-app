import "server-only"

import { and, eq, gte, lt, or } from "drizzle-orm"

import { db } from "@/server/db"
import { loginAttempts } from "@/server/db/schema"

/**
 * Límite de intentos fallidos de login.
 *
 * Por email frena que alguien pruebe contraseñas contra una cuenta. Por IP
 * frena que pruebe una contraseña común contra muchas cuentas. El de IP es más
 * alto porque varias personas pueden compartir la misma (una casa, una oficina).
 */
export const LOGIN_WINDOW_MS = 15 * 60 * 1000
export const MAX_FAILURES_PER_EMAIL = 5
export const MAX_FAILURES_PER_IP = 20

export async function isLoginAllowed(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS)

  const [byEmail, byIp] = await Promise.all([
    db.$count(loginAttempts, and(eq(loginAttempts.email, email), gte(loginAttempts.createdAt, since))),
    ip ? db.$count(loginAttempts, and(eq(loginAttempts.ip, ip), gte(loginAttempts.createdAt, since))) : 0,
  ])

  return byEmail < MAX_FAILURES_PER_EMAIL && byIp < MAX_FAILURES_PER_IP
}

export async function recordFailedLogin(email: string, ip: string | null): Promise<void> {
  await db.insert(loginAttempts).values({ email, ip })
  // Purga oportunista: lo que quedó fuera de la ventana ya no cuenta para nada.
  // Sólo de este email o esta IP, para que cada intento haga un trabajo acotado.
  const before = new Date(Date.now() - LOGIN_WINDOW_MS)
  await db
    .delete(loginAttempts)
    .where(
      and(
        lt(loginAttempts.createdAt, before),
        ip ? or(eq(loginAttempts.email, email), eq(loginAttempts.ip, ip)) : eq(loginAttempts.email, email),
      ),
    )
}

/**
 * Tras un login correcto se borran los fallos del email, pero no los de la IP:
 * si no, quien ataca muchas cuentas podría resetear el contador de su IP
 * logueándose cada tanto con una cuenta propia.
 */
export async function clearFailedLogins(email: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.email, email))
}
