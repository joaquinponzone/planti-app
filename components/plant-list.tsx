"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlarmClockCheck,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Droplet,
  ListChecks,
  Loader2,
  MoreVertical,
  NotebookText,
  Pencil,
  Trash2,
} from "lucide-react"

import { addCareActivity, deletePlant } from "@/app/(app)/actions"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  getWateringStatus,
  parseWateringStatuses,
  WATERING_STATUSES,
  type Thresholds,
  type WateringStatus,
} from "@/lib/care"
import { saveCollapsedLocations } from "@/lib/collapsed-locations"
import { formatDaysAgo } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { badgeVariants } from "./ui/badge"
import { WateringFilter } from "./watering-filter"

export type PlantCardData = {
  id: string
  name: string
  location: string | null
  needsCare: boolean
  daysSinceLastWatered: number | null
}

const NO_LOCATION = "Sin ubicación"

function locationOf(plant: PlantCardData) {
  return plant.location || NO_LOCATION
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function PlantCard({
  plant,
  status,
  onDelete,
}: {
  plant: PlantCardData
  /** `null`: nunca se regó. Se pinta como "ok". */
  status: WateringStatus | null
  onDelete: (id: string) => void
}) {
  const [watering, startWatering] = useTransition()

  return (
    <div
      className={cn(
        `border-4 ${plant.needsCare ? "border-destructive" : "border-black"} text-card-foreground overflow-hidden neo-brutalist-shadow`,
        "bg-card dark:bg-primary/20",
        {
          "bg-yellow-200/50 dark:bg-yellow-900/50": status === "warning",
          "bg-red-200/50 dark:bg-red-900/50": status === "danger",
        },
      )}
    >
      <div className="flex items-center p-4">
        <div className="flex-grow">
          <span className="flex gap-2 items-center">
            <h3 className="text-xl font-bold">{plant.name}</h3>
          </span>
          <hr className="my-2 w-3/4 border-2 border-black" />
          <div className="flex flex-col gap-1">
            {plant.daysSinceLastWatered !== null && (
              <p className="text-sm">
                Último riego:{" "}
                <span className="text-black dark:text-white font-bold font-mono">
                  {capitalize(formatDaysAgo(plant.daysSinceLastWatered))}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => startWatering(async () => void (await addCareActivity({ plantId: plant.id, type: "watered" })))}
            disabled={watering}
            className={cn(
              "bg-blue-500 hover:bg-blue-600 text-white border-2 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all",
              {
                "animate-pulse": status === "warning" && !watering,
                "animate-bounce": status === "danger" && !watering,
              },
            )}
            size="icon"
          >
            {watering ? <Loader2 className="h-5 w-5 animate-spin" /> : <Droplet className="h-5 w-5" />}
            <span className="sr-only">Regar</span>
          </Button>

          <Link href={`/plant/${plant.id}`}>
            <Button
              variant="outline"
              size="icon"
              className="border-2 border-black hover:bg-primary hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <NotebookText className="h-5 w-5" />
              <span className="sr-only">Detalle</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-2 border-black hover:bg-primary hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Más opciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border-2 border-black">
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                <Link href={`/plant/${plant.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar planta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive hover:text-destructive-foreground hover:bg-destructive"
                onSelect={() => onDelete(plant.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Borrar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {plant.needsCare && (
        <div className="bg-destructive/20 p-3 text-sm font-medium border-t-2 border-destructive">Necesita cuidados</div>
      )}
    </div>
  )
}

export default function PlantList({
  plants,
  thresholds,
  initialCollapsed,
}: {
  plants: PlantCardData[]
  thresholds: Thresholds
  /** Ambientes plegados según la cookie (ver `lib/collapsed-locations.ts`). */
  initialCollapsed: string[]
}) {
  const [plantToDelete, setPlantToDelete] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(() => new Set(initialCollapsed))
  const [, startDeleting] = useTransition()
  const searchParams = useSearchParams()

  if (plants.length === 0) {
    return (
      <div className="border-4 border-black p-8 text-center bg-white dark:bg-neutral-800 neo-brutalist-shadow">
        <h3 className="text-xl font-bold mb-4">¡Todavía no hay plantas!</h3>
        <p className="mb-4 text-muted-foreground">Agregá la primera para empezar a registrar sus cuidados.</p>
        <Link
          href="/add-plant"
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 border-2 border-black neo-brutalist-shadow transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          Agregar planta
        </Link>
        <p className="mt-6 text-sm">
          ¿Usabas Planti antes?{" "}
          <Link href="/import" className="font-bold underline underline-offset-4">
            Importá tu backup
          </Link>
        </p>
      </div>
    )
  }

  const withStatus = plants.map((plant) => ({ plant, status: getWateringStatus(plant.daysSinceLastWatered, thresholds) }))
  const counts = Object.fromEntries(
    WATERING_STATUSES.map((s) => [s, withStatus.filter((p) => p.status === s).length]),
  ) as Record<WateringStatus, number>

  // El filtro vive en la URL (`?status=danger,warning`): sobrevive a recargar y
  // a volver desde el detalle de una planta.
  const selected = parseWateringStatuses(searchParams.get("status"))
  const visible = selected.length
    ? withStatus.filter((p) => p.status !== null && selected.includes(p.status))
    : withStatus

  function toggleStatus(status: WateringStatus) {
    const next = WATERING_STATUSES.filter((s) => (s === status ? !selected.includes(s) : selected.includes(s)))
    // `replaceState` y no `router.replace`: filtrar no necesita ir al servidor.
    // Next sincroniza `useSearchParams` con el historial nativo. Se arma a mano
    // para que la coma no quede escapada (`%2C`) en la barra de direcciones.
    window.history.replaceState(null, "", next.length ? `?status=${next.join(",")}` : window.location.pathname)
  }

  // Agrupadas por ubicación; el servidor ya las manda ordenadas por último riego.
  const groupedPlants = visible.reduce<Record<string, typeof visible>>((acc, entry) => {
    ;(acc[locationOf(entry.plant)] ??= []).push(entry)
    return acc
  }, {})
  const visibleLocations = Object.keys(groupedPlants)
  const allCollapsed = visibleLocations.length > 0 && visibleLocations.every((l) => collapsed.has(l))

  function updateCollapsed(next: Set<string>) {
    // Sólo se guardan ambientes que existen: uno renombrado o vacío no queda
    // para siempre en la cookie.
    const existing = new Set(plants.map(locationOf))
    const pruned = new Set([...next].filter((l) => existing.has(l)))
    setCollapsed(pruned)
    saveCollapsedLocations(pruned)
  }

  function setLocationCollapsed(location: string, value: boolean) {
    const next = new Set(collapsed)
    if (value) next.add(location)
    else next.delete(location)
    updateCollapsed(next)
  }

  // Actúa sobre los ambientes a la vista: con un filtro puesto, "Desplegar
  // todos" abre los que se ven, no los que el filtro escondió.
  function toggleAll() {
    const next = new Set(collapsed)
    for (const l of visibleLocations) {
      if (allCollapsed) next.delete(l)
      else next.add(l)
    }
    updateCollapsed(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WateringFilter selected={selected} counts={counts} onToggle={toggleStatus} />
        {visibleLocations.length > 1 && (
          <button
            type="button"
            onClick={toggleAll}
            className="flex w-fit items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white"
          >
            {allCollapsed ? (
              <ChevronsUpDown aria-hidden className="size-4" />
            ) : (
              <ChevronsDownUp aria-hidden className="size-4" />
            )}
            {allCollapsed ? "Desplegar todos" : "Plegar todos"}
          </button>
        )}
      </div>

      {visible.length === 0 && (
        <div className="border-4 border-black p-6 text-center bg-white dark:bg-neutral-800 neo-brutalist-shadow">
          <p className="mb-4 font-bold">Ninguna planta con ese estado.</p>
          <button
            type="button"
            onClick={() => window.history.replaceState(null, "", window.location.pathname)}
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 border-2 border-black neo-brutalist-shadow transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Ver todas
          </button>
        </div>
      )}

      {Object.entries(groupedPlants).map(([location, entries]) => {
        const statuses = entries.map((e) => e.status)
        const inDanger = statuses.filter((s) => s === "danger").length
        const inWarning = statuses.filter((s) => s === "warning").length
        const open = !collapsed.has(location)

        return (
          <Collapsible key={location} open={open} onOpenChange={(next) => setLocationCollapsed(location, !next)}>
            {/*
              El h2 envuelve al botón (y no al revés): un botón no puede tener
              un título adentro, y así el lector de pantalla lo anuncia como
              título y como botón desplegable.
            */}
            <h2>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group flex w-full items-center gap-2 border-b-4 border-black pb-1 text-left text-lg font-semibold transition-colors hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:hover:text-accent dark:focus-visible:outline-white"
                >
                  <ChevronDown
                    aria-hidden
                    className="size-5 shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90 motion-reduce:transition-none"
                  />
                  <span className="min-w-0 truncate">{capitalize(location)}</span>
                  {/* Plegado oculta las tarjetas, no el aviso: los contadores quedan a la vista. */}
                  {inDanger + inWarning === 0 ? (
                    <ListChecks aria-label="Todas al día" className="size-5 shrink-0" />
                  ) : (
                    <span className="flex shrink-0 items-center gap-2">
                      <AlarmClockCheck aria-hidden className="size-5" />
                      {/* `span` y no `Badge`, que es un `div`: no puede ir dentro de un botón. */}
                      {inDanger > 0 && (
                        <span
                          className={cn(badgeVariants({ variant: "destructive" }), "border-2 border-black")}
                          aria-label={`${inDanger} en peligro`}
                        >
                          {inDanger}
                        </span>
                      )}
                      {inWarning > 0 && (
                        <span
                          className={cn(badgeVariants(), "bg-yellow-200/50 hover:bg-yellow-200/70 border-2 border-black")}
                          aria-label={`${inWarning} en aviso`}
                        >
                          {inWarning}
                        </span>
                      )}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-sm font-normal text-muted-foreground">
                    {entries.length === 1 ? "1 planta" : `${entries.length} plantas`}
                  </span>
                </button>
              </CollapsibleTrigger>
            </h2>
            {/*
              `overflow-hidden` es lo que deja animar la altura, pero recortaría
              la sombra de 4 px de las tarjetas: el margen negativo con padding le
              da lugar sin mover nada.
            */}
            <CollapsibleContent className="-mb-2 -mr-2 overflow-hidden pb-2 pr-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
              <div className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-2">
                {entries.map(({ plant, status }) => (
                  <PlantCard key={plant.id} plant={plant} status={status} onDelete={setPlantToDelete} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
      })}

      <AlertDialog open={!!plantToDelete} onOpenChange={() => setPlantToDelete(null)}>
        <AlertDialogContent className="border-2 border-black neo-brutalist-shadow">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar la planta?</AlertDialogTitle>
            <AlertDialogDescription>
              No se puede deshacer: se borran la planta y todo su historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-black"
              onClick={() => {
                const id = plantToDelete
                if (id) startDeleting(() => deletePlant(id))
                setPlantToDelete(null)
              }}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
