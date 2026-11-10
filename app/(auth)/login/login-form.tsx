"use client"

import Link from "next/link"
import { useActionState } from "react"
import { LogIn } from "lucide-react"

import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/auth/auth-form"

import { login, resendVerification, type FormState } from "../actions"

export function LoginForm({ from, justReset }: { from: string; justReset: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(login, {})
  const [resendState, resendAction] = useActionState<FormState, FormData>(resendVerification, {})

  return (
    <AuthCard title="Entrar">
      <form action={action} className="space-y-6">
        <input type="hidden" name="from" value={from} />
        {justReset && !state.error && <FormMessage message="Cambiaste tu contraseña. Entrá con la nueva." />}
        <FormMessage error={state.error} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton>
          <LogIn className="mr-2 h-6 w-6" />
          Entrar
        </SubmitButton>
      </form>

      {state.unverifiedEmail && (
        <form action={resendAction} className="mt-4 space-y-3">
          <input type="hidden" name="email" value={state.unverifiedEmail} />
          <FormMessage message={resendState.message} error={resendState.error} />
          <button type="submit" className="font-bold underline underline-offset-4">
            Mandame de nuevo el email de confirmación
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-2 text-sm">
        <Link href="/forgot-password" className="underline underline-offset-4">
          ¿Te olvidaste la contraseña?
        </Link>
        <p>
          ¿Primera vez en Planti?{" "}
          <Link href="/register" className="font-bold underline underline-offset-4">
            Creá tu cuenta
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
