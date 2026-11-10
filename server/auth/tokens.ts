import "server-only"

import { createHash, randomBytes } from "node:crypto"

import { and, desc, eq, gt, gte, isNotNull, isNull, lt, or, sql } from "drizzle-orm"

import { db } from "@/server/db"
import { authTokens, users, type User } from "@/server/db/schema"

import { sendAuthEmail, type AuthEmailKind } from "./email"
import { hashPassword } from "./password"

type Purpose = "verify_email" | "reset_password"

const TTL_MS: Record<Purpose, number> = {
  verify_email: 24 * 60 * 60 * 1000,
  reset_password: 30 * 60 * 1000,
}

/** Entre un email y el siguiente del mismo tipo, para el mismo usuario. */
export const RESEND_COOLDOWN_MS = 60 * 1000
/**
 * La ventana del límite y la de la purga son la misma hora a propósito:
 * mientras el límite cuente envíos de esta ventana, borrar una fila de adentro
 * le devolvería intentos a quien reenvía.
 */
export const SEND_WINDOW_MS = 60 * 60 * 1000
export const MAX_SENDS_PER_HOUR = 5

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex")
}

async function canSend(userId: string, purpose: Purpose): Promise<boolean> {
  const since = new Date(Date.now() - SEND_WINDOW_MS)
  const scope = and(eq(authTokens.userId, userId), eq(authTokens.purpose, purpose), isNotNull(authTokens.sentAt))

  const [hourly, [latest]] = await Promise.all([
    db.$count(authTokens, and(scope, gte(authTokens.sentAt, since))),
    db.select({ sentAt: authTokens.sentAt }).from(authTokens).where(scope).orderBy(desc(authTokens.sentAt)).limit(1),
  ])

  if (hourly >= MAX_SENDS_PER_HOUR) return false
  if (latest?.sentAt && Date.now() - latest.sentAt.getTime() < RESEND_COOLDOWN_MS) return false
  return true
}

/**
 * Crea un token nuevo y manda el email. Si se pasó del límite de envíos, no
 * hace nada en silencio: quien llama responde siempre lo mismo, haya mandado
 * o no.
 *
 * Pensado para correr dentro de `after()`: tarda lo que tarda Resend, y si la
 * respuesta lo esperara, un email existente tardaría más que uno inventado.
 *
 * `kind` puede diferir de `purpose`: el aviso "ya tenés cuenta" usa un token
 * de reset, pero otro texto.
 */
export async function issueToken(user: User, purpose: Purpose, kind: AuthEmailKind = purpose): Promise<void> {
  if (!(await canSend(user.id, purpose))) return

  const rawToken = randomBytes(32).toString("base64url")
  const now = new Date()

  // Transacción de escritura: en SQLite serializa contra otras escrituras, así
  // que dos pedidos simultáneos no pueden dejar dos tokens vigentes.
  const stored = await db.transaction(async (tx) => {
    if (purpose === "verify_email") {
      const [current] = await tx.select({ verified: users.emailVerifiedAt }).from(users).where(eq(users.id, user.id))
      if (!current || current.verified) return null // se verificó mientras esto esperaba
    }

    // Sólo el último link sirve: los anteriores del mismo tipo quedan anulados.
    await tx
      .update(authTokens)
      .set({ consumedAt: now })
      .where(and(eq(authTokens.userId, user.id), eq(authTokens.purpose, purpose), isNull(authTokens.consumedAt)))

    // Purga: tokens ya muertos de este usuario y fuera de la ventana del límite.
    await tx
      .delete(authTokens)
      .where(
        and(
          eq(authTokens.userId, user.id),
          lt(authTokens.createdAt, new Date(now.getTime() - SEND_WINDOW_MS)),
          or(isNotNull(authTokens.consumedAt), lt(authTokens.expiresAt, now)),
        ),
      )

    const [row] = await tx
      .insert(authTokens)
      .values({
        userId: user.id,
        purpose,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(now.getTime() + TTL_MS[purpose]),
      })
      .returning({ id: authTokens.id })
    return row
  })

  if (!stored) return

  try {
    await sendAuthEmail(user.email, kind, rawToken)
    // `sentAt` sólo se marca si salió: un envío fallido no consume cupo.
    await db.update(authTokens).set({ sentAt: new Date() }).where(eq(authTokens.id, stored.id))
  } catch (error) {
    console.error("[auth] No se pudo mandar el email.", error)
  }
}

/**
 * Consume un token: lo marca usado y devuelve su fila, o null si no existe,
 * venció, ya se usó o fue reemplazado. Es un único UPDATE condicional, así que
 * dos clics simultáneos sobre el mismo link no pueden consumirlo dos veces.
 */
async function consume(tx: Pick<typeof db, "update">, rawToken: string, purpose: Purpose, now: Date) {
  const [token] = await tx
    .update(authTokens)
    .set({ consumedAt: now })
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(rawToken)),
        eq(authTokens.purpose, purpose),
        isNull(authTokens.consumedAt),
        gt(authTokens.expiresAt, now),
      ),
    )
    .returning()
  return token ?? null
}

export async function verifyEmailToken(rawToken: string): Promise<User | null> {
  const now = new Date()
  return db.transaction(async (tx) => {
    const token = await consume(tx, rawToken, "verify_email", now)
    if (!token) return null
    const [user] = await tx
      .update(users)
      .set({ emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, ${now.getTime()})` })
      .where(eq(users.id, token.userId))
      .returning()
    return user ?? null
  })
}

/**
 * Cambia la contraseña con un token de reset.
 *
 * - Sube `sessionVersion`: cierra todas las sesiones abiertas, incluida la de
 *   quien haya entrado con la contraseña vieja.
 * - Verifica el email si no lo estaba: recibir el link ya prueba que el buzón
 *   es de quien lo usa.
 * - Anula los demás tokens vigentes, para que un link de confirmación viejo no
 *   quede funcionando como acceso sin contraseña.
 */
export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<User | null> {
  const passwordHash = await hashPassword(newPassword)
  const now = new Date()
  return db.transaction(async (tx) => {
    const token = await consume(tx, rawToken, "reset_password", now)
    if (!token) return null

    const [user] = await tx
      .update(users)
      .set({
        passwordHash,
        emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, ${now.getTime()})`,
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(eq(users.id, token.userId))
      .returning()
    if (!user) return null

    await tx
      .update(authTokens)
      .set({ consumedAt: now })
      .where(and(eq(authTokens.userId, user.id), isNull(authTokens.consumedAt)))
    return user
  })
}
