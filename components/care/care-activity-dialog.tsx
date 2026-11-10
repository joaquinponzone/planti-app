"use client"

import type React from "react"
import { useState, useTransition } from "react"

import { addCareActivity } from "@/app/(app)/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { CareActivityType } from "@/lib/care"

const DETAILS = {
  repotted: {
    label: "Repotting Details",
    placeholder: "Enter details about the repotting (e.g., new pot size, soil mix used)",
  },
  fertilized: {
    label: "Fertilizer Details",
    placeholder: "Enter details about fertilization (e.g., type, amount, concentration)",
  },
  medicated: {
    label: "Treatment Details",
    placeholder: "Enter details about the treatment (e.g., pest/disease, product used, dosage)",
  },
  moved: {
    label: "Location Change Details",
    placeholder: "Enter details about the new location (e.g., room, light conditions)",
  },
} satisfies Partial<Record<CareActivityType, { label: string; placeholder: string }>>

/** Los cuidados que piden notas antes de registrarse. */
export const ACTIVITIES_WITH_NOTES = Object.keys(DETAILS) as CareActivityType[]

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

  const details = DETAILS[activityType as keyof typeof DETAILS]

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
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-4 neo-brutalist-shadow border-black">
          <DialogHeader>
            <DialogTitle>Add {details.label}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
            <Textarea
              placeholder={details.placeholder}
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
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={pending} className="border-2 border-black neo-brutalist-shadow">
              {pending ? "Saving..." : "Save Care Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
