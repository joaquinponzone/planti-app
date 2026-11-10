import { getCurrentUser } from "@/lib/dal"
import { buildExport } from "@/server/backup/export"

/**
 * Descarga el backup de la cuenta. Es un GET (lo abre un link) y sólo lee:
 * no hace falta protección contra CSRF.
 *
 * El proxy ya redirige a quien no tiene cookie; acá se valida la sesión contra
 * la base, igual que en las páginas (sesión revocada → 401, no datos).
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 })

  const now = new Date()
  const backup = await buildExport(user.id, now)
  // La fecha del nombre, en la zona del usuario: exportar a las 22 h en
  // Buenos Aires no tiene que dar un archivo "de mañana".
  const day = now.toLocaleDateString("en-CA", { timeZone: user.timezone }).replaceAll("-", "")

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="planti-backup-${day}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
