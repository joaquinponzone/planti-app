import { z } from "./zod"

/** `Juan@X.com` y `juan@x.com` son la misma cuenta: se guarda y se busca normalizado. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Deja ver dos caracteres y el dominio: alcanza para reconocer el buzón propio
 * y no para descubrir uno ajeno. El relleno tiene un piso de tres puntos para
 * no revelar el largo de la parte local.
 */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@")
  const visible = local.slice(0, Math.min(2, local.length))
  const hidden = "•".repeat(Math.max(3, local.length - visible.length))
  return `${visible}${hidden}@${domain}`
}

export const PASSWORD_MIN_LENGTH = 8

/**
 * bcrypt ignora todo lo que pasa de 72 bytes. Sin este tope, "una contraseña
 * de 80 caracteres" y sus primeros 72 serían la misma contraseña, sin aviso.
 * Son bytes, no caracteres: un emoji ocupa 4.
 */
export const PASSWORD_MAX_BYTES = 72

const email = z.email("Ese email no parece válido").transform(normalizeEmail)

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Usá al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .refine((v) => new TextEncoder().encode(v).length <= PASSWORD_MAX_BYTES, "Esa contraseña es demasiado larga")

export const LoginSchema = z.object({
  email,
  // Al loguearse no se valida el formato: una regla nueva no puede dejar
  // afuera a quien eligió su contraseña cuando la regla no existía.
  password: z.string().min(1, "Escribí tu contraseña"),
})

export const RegisterSchema = z.object({ email, password: newPassword })

export const EmailSchema = z.object({ email })

export const ResetPasswordSchema = z.object({
  token: z.string().min(20, "El enlace no es válido"),
  password: newPassword,
})

export const TokenSchema = z.object({
  token: z.string().min(20, "El enlace no es válido"),
})
