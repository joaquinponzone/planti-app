"use server"

import { eq } from "drizzle-orm"
import { after } from "next/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  EmailSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  TokenSchema,
} from "@/lib/auth-validation"
import { safeFrom } from "@/lib/safe-redirect"
import { hashPassword, verifyPassword } from "@/server/auth/password"
import { clearFailedLogins, isLoginAllowed, recordFailedLogin } from "@/server/auth/rate-limit"
import { createSession, destroySession } from "@/server/auth/session"
import { issueToken, resetPasswordWithToken, verifyEmailToken } from "@/server/auth/tokens"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"

export type FormState = {
  error?: string
  message?: string
  /** El login falló porque falta confirmar el email: la pantalla ofrece reenviarlo. */
  unverifiedEmail?: string
}

const INVALID_CREDENTIALS = "Email o contraseña incorrectos"
const INVALID_LINK = "El enlace venció, ya se usó o lo reemplazó uno más nuevo."
const GENERIC_EMAIL_SENT = "Si hay una cuenta con ese email, te mandamos un enlace. Revisá tu bandeja de entrada."

function firstIssue(error: { issues: { message: string }[] }): FormState {
  return { error: error.issues[0]?.message ?? "Revisá el formulario y probá de nuevo" }
}

/** Vercel pone la IP real del cliente primera en `x-forwarded-for`. */
async function clientIp(): Promise<string | null> {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
}

async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user ?? null
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") })
  if (!parsed.success) return firstIssue(parsed.error)
  const { email, password } = parsed.data

  const ip = await clientIp()
  if (!(await isLoginAllowed(email, ip))) {
    return { error: "Demasiados intentos. Esperá 15 minutos o recuperá tu contraseña." }
  }

  const user = await findUserByEmail(email)
  // Corre bcrypt aunque el usuario no exista: ver `verifyPassword`.
  if (!(await verifyPassword(password, user?.passwordHash))) {
    await recordFailedLogin(email, ip)
    return { error: INVALID_CREDENTIALS }
  }

  // Recién después de validar la contraseña: chequear antes el estado
  // permitiría averiguar qué emails tienen cuenta sin saber ninguna.
  if (!user!.emailVerifiedAt) {
    return { error: "Confirmá tu email antes de entrar.", unverifiedEmail: email }
  }

  await clearFailedLogins(email)
  await createSession(user!)
  redirect(safeFrom(formData.get("from")))
}

/**
 * Responde lo mismo exista o no la cuenta, para no revelar qué emails están
 * registrados:
 * - email nuevo → crea la cuenta y manda la confirmación;
 * - existe sin confirmar → reenvía la confirmación;
 * - existe confirmada → le avisa al dueño, con un link para cambiar la contraseña.
 *
 * El hash se calcula siempre, antes de buscar, para que los tres caminos
 * tarden parecido. Los emails salen en `after()`, fuera de la respuesta.
 */
export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse({ email: formData.get("email"), password: formData.get("password") })
  if (!parsed.success) return firstIssue(parsed.error)
  const { email, password } = parsed.data

  const passwordHash = await hashPassword(password)
  const existing = await findUserByEmail(email)

  if (existing) {
    after(() =>
      existing.emailVerifiedAt
        ? issueToken(existing, "reset_password", "already_registered")
        : issueToken(existing, "verify_email"),
    )
  } else {
    // `onConflictDoNothing`: si dos registros del mismo email llegan juntos,
    // el segundo no falla con un error de UNIQUE (que delataría la cuenta).
    const [created] = await db.insert(users).values({ email, passwordHash }).onConflictDoNothing().returning()
    if (created) after(() => issueToken(created, "verify_email"))
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`)
}

export async function resendVerification(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = EmailSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) return firstIssue(parsed.error)

  const user = await findUserByEmail(parsed.data.email)
  if (user && !user.emailVerifiedAt) after(() => issueToken(user, "verify_email"))
  return { message: GENERIC_EMAIL_SENT }
}

/**
 * Confirma el email y abre sesión. Va por POST (un botón en la página) y no
 * al abrir el link: los antivirus de correo visitan los links de los emails
 * para analizarlos, y un GET que consume el token lo gastaría antes de que la
 * persona haga clic.
 */
export async function verifyEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = TokenSchema.safeParse({ token: formData.get("token") })
  if (!parsed.success) return firstIssue(parsed.error)

  const user = await verifyEmailToken(parsed.data.token)
  if (!user) return { error: INVALID_LINK }

  await clearFailedLogins(user.email)
  await createSession(user)
  redirect("/")
}

export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = EmailSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) return firstIssue(parsed.error)

  const user = await findUserByEmail(parsed.data.email)
  if (user) after(() => issueToken(user, "reset_password"))
  return { message: GENERIC_EMAIL_SENT }
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = ResetPasswordSchema.safeParse({ token: formData.get("token"), password: formData.get("password") })
  if (!parsed.success) return firstIssue(parsed.error)

  const user = await resetPasswordWithToken(parsed.data.token, parsed.data.password)
  if (!user) return { error: INVALID_LINK }

  // Quien recuperó la contraseña probablemente estaba bloqueado por intentos.
  await clearFailedLogins(user.email)
  // La sesión de este navegador (si había) ya quedó revocada por el cambio de
  // `sessionVersion`; se borra la cookie para no dejar una sesión muerta.
  await destroySession()
  redirect("/login?reset=1")
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect("/login")
}
