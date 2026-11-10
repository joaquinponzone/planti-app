"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Settings } from "lucide-react"

import { updateThresholds, type ActionState } from "@/app/(app)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

export function ConfigPopover({ warningDays, dangerDays }: { warningDays: number; dangerDays: number }) {
  const [isOpen, setIsOpen] = useState(false)

  // Cierra el popover sólo si se guardó; con error queda abierto mostrándolo.
  const [state, formAction] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await updateThresholds(prev, formData)
    if (!result.error) setIsOpen(false)
    return result
  }, {})

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
          El formulario se monta cada vez que se abre el popover, así que los
          `defaultValue` arrancan siempre desde lo guardado: cancelar no deja
          valores a medio editar para la próxima vez.
        */}
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
                defaultValue={warningDays}
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
                defaultValue={dangerDays}
                className="col-span-2 h-8 border-2 border-black focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)} className="border-2 border-black">
              Cancelar
            </Button>
            <SaveButton />
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
