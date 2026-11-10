import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { readSession } from "@/server/auth/session"

/**
 * Data Access Layer: TODA lectura del usuario actual pasa por acá.
 *
 * El proxy es una primera barrera (redirige a quien no tiene cookie), pero
 * sólo valida la firma del JWT. La autorización de verdad es esta: cada Server
 * Action y cada página que lea datos tiene que llamar a `requireUser()`.
 *
 * `cache` hace que en una misma request la consulta a la base corra una vez,
 * aunque la llamen el layout, la página y varios componentes.
 */
export const getCurrentUser = cache(readSession)

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}
