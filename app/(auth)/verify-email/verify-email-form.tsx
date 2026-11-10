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
      <AuthCard title="Confirm your email" subtitle="One click and you're in.">
        <form action={verifyAction} className="space-y-6">
          <input type="hidden" name="token" value={token} />
          <FormMessage error={verifyState.error} />
          <SubmitButton>
            <MailCheck className="mr-2 h-6 w-6" />
            Confirm my email
          </SubmitButton>
        </form>
        {verifyState.error && (
          <p className="mt-6 text-sm">
            You can{" "}
            <Link href="/login" className="font-bold underline underline-offset-4">
              log in
            </Link>{" "}
            to get a new link.
          </p>
        )}
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Check your inbox"
      subtitle={
        // Vale en los tres casos del registro (cuenta nueva, sin confirmar o ya
        // existente): en todos sale un email, aunque no siempre el mismo.
        email
          ? `We've sent an email to ${maskEmail(email)}. Follow the link inside to continue.`
          : "We've sent you an email. Follow the link inside to continue."
      }
    >
      <p className="mb-6">The link expires in 24 hours. Remember to check the spam folder.</p>
      {email && (
        <form action={resendAction} className="space-y-3">
          <input type="hidden" name="email" value={email} />
          <FormMessage message={resendState.message} error={resendState.error} />
          <button type="submit" className="font-bold underline underline-offset-4">
            Didn&apos;t get it? Send it again
          </button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/login" className="underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </AuthCard>
  )
}
