"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Settings } from "lucide-react"

import { updateThresholds, type ActionState } from "@/app/(app)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFormAction } from "@/lib/use-form-action"

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      className="bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-black"
    >
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  )
}

type Thresholds = { warningDays: number; dangerDays: number }

export function ConfigPopover({ warningDays, dangerDays }: Thresholds) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-2 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">Configurar alertas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 border-2 border-black bg-background neo-brutalist-shadow">
        {/*
          `PopoverContent` desmonta lo de adentro al cerrarse, así que el
          formulario (y su estado) arranca de cero cada vez que se abre: cancelar
          no deja ni valores a medio editar ni el error para la próxima vez.
        */}
        <ThresholdsForm warningDays={warningDays} dangerDays={dangerDays} onDone={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

function ThresholdsForm({ warningDays, dangerDays, onDone }: Thresholds & { onDone: () => void }) {
  // Cierra el popover sólo si se guardó; con error queda abierto mostrándolo,
  // con los valores que se mandaron (ver `useFormAction`).
  const [state, formAction, values] = useFormAction<ActionState>(
    async (prev, formData) => {
      const result = await updateThresholds(prev, formData)
      if (!result.error) onDone()
      return result
    },
    {},
    ["warningDays", "dangerDays"],
  )

  return (
    <form action={formAction} className="grid gap-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Alertas de riego</h4>
        <p className="text-sm text-muted-foreground">Días sin regar hasta que la tarjeta cambia de color.</p>
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      <div className="grid gap-2">
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="warningDays">Aviso</Label>
          <Input
            id="warningDays"
            name="warningDays"
            type="number"
            min={1}
            max={365}
            required
            defaultValue={values.warningDays ?? warningDays}
            className="col-span-2 h-8 border-2 border-black focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
          />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="dangerDays">Peligro</Label>
          <Input
            id="dangerDays"
            name="dangerDays"
            type="number"
            min={1}
            max={365}
            required
            defaultValue={values.dangerDays ?? dangerDays}
            className="col-span-2 h-8 border-2 border-black focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone} className="border-2 border-black">
          Cancelar
        </Button>
        <SaveButton />
      </div>
    </form>
  )
}
