"use client"

import Link from "next/link"
import { useActionState } from "react"
import { KeyRound } from "lucide-react"

import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/auth/auth-form"
import { PASSWORD_MIN_LENGTH } from "@/lib/auth-validation"

import { resetPassword, type FormState } from "../actions"

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, {})

  return (
    <AuthCard title="Elegí una contraseña nueva" subtitle="Se va a cerrar la sesión en todos tus dispositivos.">
      <form action={action} className="space-y-6">
        <input type="hidden" name="token" value={token} />
        <FormMessage error={state.error} />
        <Field
          label="Contraseña nueva"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          hint={`Al menos ${PASSWORD_MIN_LENGTH} caracteres.`}
          required
        />
        <SubmitButton>
          <KeyRound className="mr-2 h-6 w-6" />
          Guardar contraseña
        </SubmitButton>
      </form>
      {state.error && (
        <p className="mt-6 text-sm">
          <Link href="/forgot-password" className="font-bold underline underline-offset-4">
            Pedí un enlace nuevo
          </Link>
        </p>
      )}
    </AuthCard>
  )
}
