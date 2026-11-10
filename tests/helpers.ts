import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { hashPassword } from "@/server/auth/password"

/** Todos los tests comparten una base: cada usuario lleva un email único. */
let counter = 0
export async function createUser({ verified = true, password = "correct-horse" } = {}) {
  const [user] = await db
    .insert(users)
    .values({
      email: `user${++counter}-${Date.now()}@test.dev`,
      passwordHash: await hashPassword(password),
      emailVerifiedAt: verified ? new Date() : null,
    })
    .returning()
  return user
}

/**
 * Sin RESEND_API_KEY, `sendAuthEmail` imprime el link en la consola. Esto lo
 * intercepta para que los tests puedan leer el token que "llegó por email".
 */
const logged: string[] = []
const originalLog = console.log
console.log = (...args: unknown[]) => {
  const line = args.join(" ")
  if (line.includes("[email de desarrollo]")) logged.push(line)
  else originalLog(...args)
}

export const emails = {
  count: () => logged.length,
  lastToken(): string {
    const match = logged.at(-1)?.match(/token=([\w-]+)/)
    if (!match) throw new Error("No se mandó ningún email")
    return decodeURIComponent(match[1])
  },
}

export const DAY = 24 * 60 * 60 * 1000
