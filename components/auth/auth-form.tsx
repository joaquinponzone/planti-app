"use client"

import type React from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border-4 border-black bg-white dark:bg-neutral-800 p-6 md:p-8 neo-brutalist-shadow">
      <h1 className="text-3xl font-bold border-b-4 border-black pb-2 mb-2">{title}</h1>
      {subtitle && <p className="mb-6 text-muted-foreground">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}
      {children}
    </div>
  )
}

export function Field({
  label,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; hint?: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.name} className="text-lg">
        {label}
      </Label>
      <Input
        id={props.name}
        className="border-2 border-black bg-card/30 dark:bg-card/20 h-12 px-4 neo-brutalist-shadow focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black"
        {...props}
      />
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold border-4 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
    >
      {pending ? <Loader2 className="h-6 w-6 animate-spin" /> : children}
    </Button>
  )
}

/** Errores en rojo, avisos en verde. `role` hace que el lector de pantalla los anuncie. */
export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <p role="alert" className="border-2 border-black bg-red-100 dark:bg-red-950 p-3 font-medium">
        {error}
      </p>
    )
  }
  if (message) {
    return (
      <p role="status" className="border-2 border-black bg-primary/20 p-3 font-medium">
        {message}
      </p>
    )
  }
  return null
}
