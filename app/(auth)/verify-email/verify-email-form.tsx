"use client"

import Link from "next/link"
import { useActionState } from "react"
import { MailCheck } from "lucide-react"

import { AuthCard, FormMessage, SubmitButton } from "@/components/auth/auth-form"
import { maskEmail } from "@/lib/auth-validation"

import { resendVerification, verifyEmail, type FormState } from "../actions"

export function VerifyEmailForm({ token, email }: { token?: string; email?: string }) {
  const [verifyState, verifyAction] = useActionState<FormState, FormData>(verifyEmail, {})
  const [resendState, resendAction] = useActionState<FormState, FormData>(resendVerification, {})

  if (token) {
    return (
      <AuthCard title="Confirmá tu email" subtitle="Un clic y entrás.">
        <form action={verifyAction} className="space-y-6">
          <input type="hidden" name="token" value={token} />
          <FormMessage error={verifyState.error} />
          <SubmitButton>
            <MailCheck className="mr-2 h-6 w-6" />
            Confirmar mi email
          </SubmitButton>
        </form>
        {verifyState.error && (
          <p className="mt-6 text-sm">
            Podés{" "}
            <Link href="/login" className="font-bold underline underline-offset-4">
              entrar
            </Link>{" "}
            para pedir un enlace nuevo.
          </p>
        )}
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Revisá tu email"
      subtitle={
        // Vale en los tres casos del registro (cuenta nueva, sin confirmar o ya
        // existente): en todos sale un email, aunque no siempre el mismo.
        email
          ? `Te mandamos un email a ${maskEmail(email)}. Seguí el enlace para continuar.`
          : "Te mandamos un email. Seguí el enlace para continuar."
      }
    >
      <p className="mb-6">El enlace vence en 24 horas. Fijate también en la carpeta de spam.</p>
      {email && (
        <form action={resendAction} className="space-y-3">
          <input type="hidden" name="email" value={email} />
          <FormMessage message={resendState.message} error={resendState.error} />
          <button type="submit" className="font-bold underline underline-offset-4">
            ¿No te llegó? Mandalo de nuevo
          </button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/login" className="underline underline-offset-4">
          Volver a entrar
        </Link>
      </p>
    </AuthCard>
  )
}
