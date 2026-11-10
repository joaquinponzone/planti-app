import { describe, expect, test } from "bun:test"
import { eq } from "drizzle-orm"

import { signSessionToken, verifySessionToken } from "@/server/auth/jwt"
import { hashPassword, verifyPassword } from "@/server/auth/password"
import {
  LOGIN_WINDOW_MS,
  MAX_FAILURES_PER_EMAIL,
  MAX_FAILURES_PER_IP,
  clearFailedLogins,
  isLoginAllowed,
  recordFailedLogin,
} from "@/server/auth/rate-limit"
import { MAX_SENDS_PER_HOUR, issueToken, resetPasswordWithToken, verifyEmailToken } from "@/server/auth/tokens"
import { db } from "@/server/db"
import { authTokens, loginAttempts } from "@/server/db/schema"

import { createUser, emails } from "./helpers"

/** Mueve `sentAt` atrás para saltear el cooldown de 60 s sin esperar. */
async function skipCooldown(userId: string) {
  await db.update(authTokens).set({ sentAt: new Date(Date.now() - 2 * 60_000) }).where(eq(authTokens.userId, userId))
}

describe("contraseñas", () => {
  test("correcta, incorrecta e inexistente", async () => {
    const hash = await hashPassword("correct-horse")
    expect(await verifyPassword("correct-horse", hash)).toBe(true)
    expect(await verifyPassword("wrong", hash)).toBe(false)
    expect(await verifyPassword("anything", null)).toBe(false)
  })

  test("un email inexistente tarda lo mismo que uno real (no se puede averiguar qué cuentas existen)", async () => {
    const hash = await hashPassword("x")
    await verifyPassword("x", null) // calienta el hash falso
    const t0 = performance.now()
    await verifyPassword("x", null)
    const missing = performance.now() - t0
    const t1 = performance.now()
    await verifyPassword("x", hash)
    const real = performance.now() - t1
    expect(missing).toBeGreaterThan(real * 0.5)
  })
})

describe("tokens de email", () => {
  test("sirven una vez, y uno nuevo anula el anterior", async () => {
    const user = await createUser({ verified: false })
    await issueToken(user, "verify_email")
    const first = emails.lastToken()

    const sent = emails.count()
    await issueToken(user, "verify_email") // dentro del cooldown: no manda nada
    expect(emails.count()).toBe(sent)

    await skipCooldown(user.id)
    await issueToken(user, "verify_email")
    const second = emails.lastToken()

    expect(await verifyEmailToken(first)).toBeNull() // reemplazado
    const verified = await verifyEmailToken(second)
    expect(verified?.emailVerifiedAt).toBeInstanceOf(Date)
    expect(await verifyEmailToken(second)).toBeNull() // ya usado

    await skipCooldown(user.id)
    const before = emails.count()
    await issueToken(verified!, "verify_email") // ya verificado: no emite
    expect(emails.count()).toBe(before)
  })

  test("uno vencido no sirve", async () => {
    const user = await createUser()
    await issueToken(user, "reset_password")
    const token = emails.lastToken()
    await db.update(authTokens).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(authTokens.userId, user.id))
    expect(await resetPasswordWithToken(token, "new-password-1")).toBeNull()
  })

  test("reset: cambia la contraseña, cierra las sesiones, verifica el email y anula el link de confirmación", async () => {
    const user = await createUser({ verified: false })
    await issueToken(user, "verify_email")
    const verifyToken = emails.lastToken()
    await issueToken(user, "reset_password")
    const resetToken = emails.lastToken()

    const after = await resetPasswordWithToken(resetToken, "brand-new-pass")
    expect(after!.sessionVersion).toBe(user.sessionVersion + 1)
    expect(after!.emailVerifiedAt).toBeInstanceOf(Date)
    expect(await verifyPassword("brand-new-pass", after!.passwordHash)).toBe(true)
    expect(await verifyEmailToken(verifyToken)).toBeNull()
  })

  test(`como mucho ${MAX_SENDS_PER_HOUR} envíos por hora`, async () => {
    const user = await createUser()
    let sent = 0
    for (let i = 0; i < MAX_SENDS_PER_HOUR + 3; i++) {
      const before = emails.count()
      await issueToken(user, "reset_password")
      if (emails.count() > before) sent++
      await skipCooldown(user.id) // salta el cooldown, no la ventana de la hora
    }
    expect(sent).toBe(MAX_SENDS_PER_HOUR)
  })
})

describe("límite de login", () => {
  test("por email, también desde otra IP", async () => {
    for (let i = 0; i < MAX_FAILURES_PER_EMAIL; i++) {
      expect(await isLoginAllowed("victim@rl.dev", "1.1.1.1")).toBe(true)
      await recordFailedLogin("victim@rl.dev", "1.1.1.1")
    }
    expect(await isLoginAllowed("victim@rl.dev", "9.9.9.9")).toBe(false)
    expect(await isLoginAllowed("other@rl.dev", "1.1.1.1")).toBe(true) // la IP no llegó a su tope
    await clearFailedLogins("victim@rl.dev")
    expect(await isLoginAllowed("victim@rl.dev", "9.9.9.9")).toBe(true)
  })

  test("por IP, aunque cada intento sea a otra cuenta", async () => {
    for (let i = 0; i < MAX_FAILURES_PER_IP; i++) await recordFailedLogin(`spray${i}@rl.dev`, "2.2.2.2")
    expect(await isLoginAllowed("fresh@rl.dev", "2.2.2.2")).toBe(false)
  })

  test("los fallos fuera de la ventana no cuentan", async () => {
    await recordFailedLogin("old@rl.dev", null)
    await db
      .update(loginAttempts)
      .set({ createdAt: new Date(Date.now() - LOGIN_WINDOW_MS - 1000) })
      .where(eq(loginAttempts.email, "old@rl.dev"))
    for (let i = 0; i < MAX_FAILURES_PER_EMAIL - 1; i++) await recordFailedLogin("old@rl.dev", null)
    expect(await isLoginAllowed("old@rl.dev", null)).toBe(true)
  })
})

test("JWT: válido, firma falsificada y basura", async () => {
  const token = await signSessionToken({ sub: "u1", sv: 3 })
  expect(await verifySessionToken(token)).toEqual({ sub: "u1", sv: 3 })

  const [header, , signature] = token.split(".")
  const payload = Buffer.from(JSON.stringify({ sub: "admin", sv: 3, exp: 9e9 })).toString("base64url")
  expect(await verifySessionToken([header, payload, signature].join("."))).toBeNull()
  expect(await verifySessionToken("garbage")).toBeNull()
})
