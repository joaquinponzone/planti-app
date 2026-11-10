import { VerifyEmailForm } from "./verify-email-form"

/**
 * Dos estados en la misma ruta:
 * - con `token` (viene del link del email): botón para confirmar;
 * - sin token (viene del registro): "revisá tu bandeja", con reenvío.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams
  return <VerifyEmailForm token={token} email={email} />
}
