import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/dal"
import { safeFrom } from "@/lib/safe-redirect"

import { LoginForm } from "./login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; reset?: string }>
}) {
  const { from, reset } = await searchParams
  // Valida contra la base, no sólo la cookie: con una sesión revocada, mandar
  // a "/" haría que el layout la rechace y vuelva acá, en loop.
  if (await getCurrentUser()) redirect(safeFrom(from))

  return <LoginForm from={safeFrom(from)} justReset={reset === "1"} />
}
