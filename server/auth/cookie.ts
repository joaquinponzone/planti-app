import { SESSION_TTL_SECONDS } from "./jwt"

export const SESSION_COOKIE = "planti_session"

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  // Same-origin: las Server Actions viven en el mismo dominio, así que `lax`
  // alcanza y además corta CSRF desde otros sitios.
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_TTL_SECONDS,
}
