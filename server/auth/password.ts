import "server-only"

import bcrypt from "bcryptjs"

const SALT_ROUNDS = 10

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Hash de una contraseña que nadie conoce, con el mismo costo que los reales.
 * Se calcula una vez por instancia.
 */
let dummyHash: Promise<string> | undefined

/**
 * Compara contra el hash del usuario o, si el email no existe, contra uno
 * falso. Sin esto, un email inexistente responde en ~1 ms y uno existente
 * tarda lo que tarda bcrypt (decenas de ms): midiendo el tiempo de respuesta
 * se puede averiguar qué emails tienen cuenta.
 */
export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (hash) return bcrypt.compare(password, hash)
  dummyHash ??= bcrypt.hash("planti-dummy-password-never-matches", SALT_ROUNDS)
  await bcrypt.compare(password, await dummyHash)
  return false
}
