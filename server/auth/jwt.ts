/**
 * Firma y verificación del token de sesión.
 *
 * Sin `server-only` a propósito: lo importa `proxy.ts`, que no corre como
 * React Server Component. Igual nunca llega al navegador, porque ningún
 * componente de cliente lo importa.
 */
import { SignJWT, jwtVerify } from "jose"

/**
 * Lo mismo que `SESSION_MAX_AGE_SECONDS` de la cookie. Si el token vence antes
 * que la cookie, el usuario "parece" logueado (el proxy ve la cookie) pero
 * cada request falla.
 */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

// En desarrollo alcanza un secreto de juguete; en Vercel no hay default. Si la
// variable no llegara al deploy y hubiera un fallback, la app firmaría tokens
// que cualquiera que lea este repo puede falsificar.
const DEV_SECRET = "dev-only-insecure-secret-planti-local"
const MIN_SECRET_LENGTH = 32

let cachedSecret: Uint8Array | null = null

/**
 * Perezoso y memoizado: evaluarlo al importar haría fallar `next build` (que
 * puede no tener la variable) en vez de la primera request, que es donde el
 * error se entiende.
 *
 * Es la ÚNICA fuente del secreto: el proxy también la usa. En futclub el proxy
 * tenía su propio fallback y aceptaba tokens firmados con el secreto de dev
 * aunque producción no tuviera la variable.
 */
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret

  const fromEnv = process.env.AUTH_SECRET
  if (process.env.VERCEL) {
    if (!fromEnv) throw new Error("Falta AUTH_SECRET: en Vercel no hay valor por defecto.")
    if (fromEnv.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `AUTH_SECRET demasiado corto (${fromEnv.length} caracteres): se necesitan al menos ${MIN_SECRET_LENGTH}.`,
      )
    }
  }

  cachedSecret = new TextEncoder().encode(fromEnv || DEV_SECRET)
  return cachedSecret
}

export type SessionClaims = {
  /** id del usuario */
  sub: string
  /** `users.sessionVersion` al firmar. Si ya no coincide, la sesión fue revocada. */
  sv: number
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ sv: claims.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret())
}

/** Devuelve los claims, o null si el token es inválido, está vencido o mal formado. */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] })
    if (typeof payload.sub !== "string" || typeof payload.sv !== "number") return null
    return { sub: payload.sub, sv: payload.sv }
  } catch {
    return null
  }
}
