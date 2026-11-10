/**
 * El destino al que volver después de loguearse.
 *
 * `from` lo pone `proxy.ts` al mandar a login, pero viaja en la query string y
 * lo puede escribir cualquiera: sin esta guarda, un link a
 * `/login?from=//evil.com` usaría nuestro login como trampolín a otro sitio.
 *
 * Sólo pasan rutas internas. `//host` y `/\host` empiezan con `/` pero son
 * URLs absolutas (protocol-relative), así que se descartan.
 */
export const DEFAULT_FROM = "/"

export function safeFrom(from: unknown): string {
  if (typeof from !== "string" || !from.startsWith("/")) return DEFAULT_FROM
  if (from.startsWith("//") || from.startsWith("/\\")) return DEFAULT_FROM
  return from
}
