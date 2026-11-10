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
    <AuthCard title="Create your account" subtitle="Your plants, on all your devices, with reminders when they need you.">
      <form action={action} className="space-y-6">
        <FormMessage error={state.error} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          required
        />
        <SubmitButton>
          <Leaf className="mr-2 h-6 w-6" />
          Create account
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-bold underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthCard>
  )
}
