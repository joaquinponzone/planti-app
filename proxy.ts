import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { SESSION_COOKIE } from "@/server/auth/cookie"
import { verifySessionToken } from "@/server/auth/jwt"

/**
 * Primera barrera: quien no tiene una sesión firmada va al login. Sólo valida
 * la firma y el vencimiento (no consulta la base); la revocación por
 * `sessionVersion` la chequea `requireUser()` en `lib/dal.ts`.
 *
 * Guarda el destino en `from` para volver ahí después de entrar.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token && (await verifySessionToken(token))) return NextResponse.next()

  const url = new URL("/login", request.url)
  const from = request.nextUrl.pathname + request.nextUrl.search
  if (from !== "/") url.searchParams.set("from", from)
  return NextResponse.redirect(url)
}

/**
 * Lo que queda AFUERA del proxy, es decir, público:
 *
 * - Las pantallas de auth. Cada entrada lleva `(?:/|$)`: el lookahead matchea
 *   por prefijo, y sin el ancla `login` también dejaría pública `/loginx`.
 * - `_next/*`, imágenes, fuentes y el favicon.
 * - `manifest.webmanifest` y `sw.js` (PWA): el navegador los pide sin sesión,
 *   y si reciben el HTML del login en vez de JSON/JS, la app deja de ser
 *   instalable o el service worker no se registra, sin ningún error visible.
 * - `api/cron`: lo llama Vercel, que se autentica con `CRON_SECRET`.
 */
export const config = {
  matcher: [
    "/((?!login(?:/|$)|register(?:/|$)|verify-email(?:/|$)|forgot-password(?:/|$)|reset-password(?:/|$)|api/cron(?:/|$)|_next/static|_next/image|favicon\\.ico$|manifest\\.webmanifest$|sw\\.js$|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|txt|woff2?)$).*)",
  ],
}
