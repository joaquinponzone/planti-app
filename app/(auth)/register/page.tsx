import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/dal"

import { RegisterForm } from "./register-form"

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/")
  return <RegisterForm />
}
