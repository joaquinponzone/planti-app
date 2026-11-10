import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-form"

import { ResetPasswordForm } from "./reset-password-form"

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams

  if (!token) {
    return (
      <AuthCard title="Invalid link" subtitle="This link is incomplete.">
        <Link href="/forgot-password" className="font-bold underline underline-offset-4">
          Ask for a new one
        </Link>
      </AuthCard>
    )
  }

  return <ResetPasswordForm token={token} />
}
