"use client"

import type React from "react"
import { useState, useTransition } from "react"

import { addCareActivity } from "@/app/(app)/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CARE_ACTIVITY_LABELS, type CareActivityType } from "@/lib/care"

const PLACEHOLDERS = {
  repotted: "Contá cómo fue el trasplante (por ejemplo: tamaño de la maceta nueva, tierra que usaste)",
  fertilized: "Contá cómo fertilizaste (por ejemplo: tipo de fertilizante, cantidad, dilución)",
  medicated: "Contá el tratamiento (por ejemplo: plaga o enfermedad, producto, dosis)",
  moved: "Contá adónde la moviste (por ejemplo: ambiente, cuánta luz recibe)",
} satisfies Partial<Record<CareActivityType, string>>

/** Los cuidados que piden notas antes de registrarse. */
export const ACTIVITIES_WITH_NOTES = Object.keys(PLACEHOLDERS) as CareActivityType[]

export function CareActivityDialog({
  plantId,
  activityType,
  trigger,
}: {
  plantId: string
  activityType: CareActivityType
  trigger: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const placeholder = PLACEHOLDERS[activityType as keyof typeof PLACEHOLDERS]

  function handleSubmit() {
    start(async () => {
      const result = await addCareActivity({ plantId, type: activityType, notes })
      if (result.error) {
        setError(result.error)
        return
      }
      setNotes("")
      setError(null)
      setIsOpen(false)
    })
  }

  return (
    <>
      {/* h-full: en la grilla de cuidados, el botón tiene que ocupar toda la altura de la fila. */}
      <div className="h-full" onClick={() => setIsOpen(true)}>{trigger}</div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-4 neo-brutalist-shadow border-black">
          <DialogHeader>
            <DialogTitle>{CARE_ACTIVITY_LABELS[activityType]}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
            <Textarea
              placeholder={placeholder}
              value={notes}
              maxLength={2000}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] bg-neutral-100 dark:bg-neutral-900 border-4 neo-brutalist-shadow border-black"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="bg-neutral-100 dark:bg-neutral-900 border-2 border-black neo-brutalist-shadow"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={pending} className="border-2 border-black neo-brutalist-shadow">
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
