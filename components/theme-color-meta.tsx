"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

/**
 * Que la barra del navegador (y la de estado de la PWA instalada) siga al tema
 * elegido en la app, no al del sistema.
 *
 * Los dos `themeColor` de `app/layout.tsx` cuelgan de `prefers-color-scheme`,
 * así que sólo aciertan cuando el tema de la app coincide con el del sistema.
 */
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    /*
     * El color sale del token computado y no de una constante, para no tener
     * una tercera copia de los hexes de `globals.css`. Para cuando corre el
     * efecto, next-themes ya puso la clase en `<html>`. El token guarda sólo
     * los componentes (`120 39% 95%`), sin el `hsl()`.
     */
    const value = getComputedStyle(document.documentElement).getPropertyValue("--background").trim()
    if (!value) return
    const color = `hsl(${value})`

    /*
     * Se pisa el `content` de los metas que emitió Next en vez de agregar uno
     * sin `media`: el navegador usa el primero que matchea, y uno agregado al
     * final del `<head>` perdería contra ellos.
     */
    const metas = document.querySelectorAll('meta[name="theme-color"]')
    if (metas.length === 0) {
      const meta = document.createElement("meta")
      meta.name = "theme-color"
      meta.content = color
      document.head.appendChild(meta)
      return
    }
    metas.forEach((meta) => meta.setAttribute("content", color))
  }, [resolvedTheme])

  return null
}
