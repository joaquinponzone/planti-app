"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Leaf } from "lucide-react"

import { AuthCard, Field, FormMessage, SubmitButton } from "@/components/auth/auth-form"
import { PASSWORD_MIN_LENGTH } from "@/lib/auth-validation"

import { register, type FormState } from "../actions"

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(register, {})

  return (
    <AuthCard title="Creá tu cuenta" subtitle="Tus plantas y su historial, en el celu y en la compu.">
      <form action={action} className="space-y-6">
        <FormMessage error={state.error} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          hint={`Al menos ${PASSWORD_MIN_LENGTH} caracteres.`}
          required
        />
        <SubmitButton>
          <Leaf className="mr-2 h-6 w-6" />
          Crear cuenta
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-bold underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </AuthCard>
  )
}
