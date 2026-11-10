"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Send } from "lucide-react"

import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/auth/auth-form"

import { forgotPassword, type FormState } from "../actions"

export default function ForgotPasswordPage() {
  const [state, action] = useActionState<FormState, FormData>(forgotPassword, {})

  return (
    <AuthCard title="¿Te olvidaste la contraseña?" subtitle="Te vamos a mandar un enlace por email para elegir una nueva.">
      <form action={action} className="space-y-6">
        <FormMessage error={state.error} message={state.message} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <SubmitButton>
          <Send className="mr-2 h-6 w-6" />
          Mandame el enlace
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm">
        <Link href="/login" className="underline underline-offset-4">
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthCard>
  )
}
