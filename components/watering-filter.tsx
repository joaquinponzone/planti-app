"use client"

import { WATERING_STATUS_LABELS, WATERING_STATUSES, type WateringStatus } from "@/lib/care"
import { cn } from "@/lib/utils"

/**
 * Los colores de cada estado, los mismos de las tarjetas: el fondo del chip
 * activo es el de la tarjeta, y la muestra es su versión plena.
 */
const STATUS_STYLES: Record<WateringStatus, { swatch: string; active: string }> = {
  danger: { swatch: "bg-red-400", active: "bg-red-200 dark:bg-red-900" },
  warning: { swatch: "bg-yellow-300", active: "bg-yellow-200 dark:bg-yellow-900" },
  // La muestra no usa `bg-primary`: ese verde pastel casi no se distingue del
  // blanco del chip.
  ok: { swatch: "bg-green-400", active: "bg-card dark:bg-primary/30" },
}

/**
 * Chips para filtrar la lista por estado de riego. Se pueden prender varios;
 * ninguno prendido es "todas".
 *
 * El chip activo queda hundido (sin sombra y corrido), que en el resto de la
 * app es el gesto de apretar un botón. Además cambia de fondo: lo hundido solo
 * se confunde con el hover.
 */
export function WateringFilter({
  selected,
  counts,
  onToggle,
}: {
  selected: readonly WateringStatus[]
  counts: Record<WateringStatus, number>
  onToggle: (status: WateringStatus) => void
}) {
  return (
    <div role="group" aria-label="Filtrar por estado de riego" className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
      {WATERING_STATUSES.map((status) => {
        const active = selected.includes(status)
        const empty = counts[status] === 0 && !active
        return (
          <button
            key={status}
            type="button"
            aria-pressed={active}
            disabled={empty}
            onClick={() => onToggle(status)}
            className={cn(
              "flex items-center justify-center gap-1.5 border-2 border-black py-1.5 px-2 text-sm font-bold transition-all sm:justify-start sm:gap-2 sm:pr-3 sm:text-base",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black dark:focus-visible:outline-white",
              active
                ? cn("translate-x-1 translate-y-1 shadow-none", STATUS_STYLES[status].active)
                : "bg-white dark:bg-neutral-800 neo-brutalist-shadow",
              !active && !empty && "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
              empty && "cursor-not-allowed opacity-40",
            )}
          >
            <span aria-hidden className={cn("size-3.5 shrink-0 border-2 border-black sm:size-4", STATUS_STYLES[status].swatch)} />
            {WATERING_STATUS_LABELS[status]}
            <span className="font-mono text-xs tabular-nums sm:text-sm">{counts[status]}</span>
          </button>
        )
      })}
    </div>
  )
}
