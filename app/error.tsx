"use client"

import { useEffect } from "react"

/**
 * Reemplaza la pantalla de error genérica de Next, que está en inglés. El caso
 * típico es que Turso no responda.
 *
 * Va en `app/` y no en `app/(app)/`: un `error.tsx` no envuelve al layout de
 * su mismo segmento, y `app/(app)/layout.tsx` ya consulta la base en
 * `requireUser()`. Desde acá cubre ese layout y todas las pantallas. El layout
 * raíz no consulta nada, así que no hace falta un `global-error.tsx`.
 *
 * El mensaje es fijo: en producción, Next no manda al navegador el texto de un
 * error del servidor, sólo `digest`, que sirve para buscarlo en los logs.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-md mx-auto border-4 border-black bg-white dark:bg-neutral-800 p-6 md:p-8 neo-brutalist-shadow">
        <h1 className="text-3xl font-bold border-b-4 border-black pb-2 mb-4">Algo salió mal</h1>
        <p className="mb-6 text-muted-foreground">
          No pudimos cargar esta pantalla. Suele ser algo pasajero: probá de nuevo en unos segundos.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 border-2 border-black neo-brutalist-shadow transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          Reintentar
        </button>
        {digest && <p className="mt-6 text-xs text-muted-foreground">Código del error: {digest}</p>}
      </div>
    </main>
  )
}
