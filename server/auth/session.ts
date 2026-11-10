import "server-only"

import { eq } from "drizzle-orm"
import { cookies } from "next/headers"

import { db } from "@/server/db"
import { users, type User } from "@/server/db/schema"

import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "./cookie"
import { signSessionToken, verifySessionToken } from "./jwt"

/**
 * Abre una sesión. Es el ÚNICO lugar donde nace una, así que las condiciones
 * para tenerla se chequean acá y no en cada camino que llega (login,
 * confirmar email, y mañana cualquier otro).
 */
export async function createSession(user: User): Promise<void> {
  if (!user.emailVerifiedAt) throw new Error("No se abre sesión sin email verificado.")
  const token = await signSessionToken({ sub: user.id, sv: user.sessionVersion })
  ;(await cookies()).set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
}

export async function destroySession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}

/** Cada cuánto se actualiza `lastSeenAt`: una escritura por usuario por hora, no por request. */
const LAST_SEEN_THROTTLE_MS = 60 * 60 * 1000

/**
 * El usuario de la cookie, o null. A diferencia del proxy, que sólo valida la
 * firma, esto confirma contra la base que la sesión siga vigente: la cuenta
 * existe, el email está verificado y `sessionVersion` coincide (cambiar la
 * contraseña revoca todos los tokens anteriores aunque no hayan vencido).
 *
 * No borra la cookie inválida: en un Server Component no se puede escribir
 * cookies. No hace falta: `/login` no pasa por el proxy y valida con esta
 * misma función, así que una cookie revocada no genera un loop de redirects.
 */
export async function readSession(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  const claims = await verifySessionToken(token)
  if (!claims) return null

  const [user] = await db.select().from(users).where(eq(users.id, claims.sub)).limit(1)
  if (!user || !user.emailVerifiedAt || user.sessionVersion !== claims.sv) return null

  if (Date.now() - (user.lastSeenAt?.getTime() ?? 0) > LAST_SEEN_THROTTLE_MS) {
    // Es un dato de conveniencia: si falla, la request sigue igual.
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, user.id))
      .catch(() => {})
  }

  return user
}
