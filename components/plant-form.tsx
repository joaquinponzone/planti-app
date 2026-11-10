"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { Leaf, Loader2, Save } from "lucide-react"

import type { ActionState } from "@/app/(app)/actions"
import { FormMessage } from "@/components/auth/auth-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const inputClass =
  "border-2 border-black bg-card/30 dark:bg-card/20 h-12 px-4 neo-brutalist-shadow focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black"

export type PlantFormValues = {
  name: string
  scientificName: string | null
  location: string | null
  notes: string | null
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus()
  const Icon = pending ? Loader2 : mode === "create" ? Leaf : Save
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-14 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold border-4 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
    >
      <Icon className={`mr-2 h-6 w-6 ${pending ? "animate-spin" : ""}`} />
      {mode === "create" ? "Create Plant" : "Save changes"}
    </Button>
  )
}

export function PlantForm({
  action,
  initial,
  mode,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  initial?: PlantFormValues
  mode: "create" | "edit"
}) {
  const router = useRouter()
  const [state, formAction] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage error={state.error} />

      <div className="space-y-2">
        <Label htmlFor="name" className="text-lg">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name}
          required
          maxLength={100}
          className={inputClass}
          placeholder="Kitchen window plant"
        />
        <p className="text-sm text-muted-foreground">
          If you don&apos;t know the name of the plant just type something that will help you identify it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scientificName" className="text-lg">
          Scientific name
        </Label>
        <Input
          id="scientificName"
          name="scientificName"
          defaultValue={initial?.scientificName ?? ""}
          maxLength={100}
          className={inputClass}
          placeholder="Scientific name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-lg">
          Location / Room
        </Label>
        <Input
          id="location"
          name="location"
          defaultValue={initial?.location ?? ""}
          maxLength={100}
          className={inputClass}
          placeholder="No location"
        />
        <p className="text-sm text-muted-foreground">To group plants by location</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-lg">
          Notes
        </Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initial?.notes ?? ""}
          maxLength={2000}
          className={`${inputClass} min-h-[100px] text-lg`}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <SubmitButton mode={mode} />
        {mode === "edit" && (
          <Button
            type="button"
            variant="outline"
            className="h-14 text-lg flex-1 border-2 border-black hover:bg-destructive/30 bg-neutral-100 dark:bg-neutral-900 hover:text-destructive-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
