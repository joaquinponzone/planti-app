import type { MetadataRoute } from "next"

/**
 * Next lo sirve en `/manifest.webmanifest`.
 *
 * Esa ruta está exenta en el matcher de `proxy.ts`. Si contestara el redirect
 * al login, el navegador recibiría HTML donde espera JSON, lo descartaría sin
 * decir nada, y la app dejaría de ser instalable justo en la pantalla de login,
 * que es donde la instala alguien nuevo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Planti",
    short_name: "Planti",
    description:
      "Anotá cuándo regaste, fertilizaste o trasplantaste tus plantas, y mirá cuáles hace mucho que no riegás.",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    /** Esto es lo que saca la barra del navegador. */
    display: "standalone",
    orientation: "portrait",
    /*
     * Un solo color: el manifest no acepta media queries, así que va el del
     * tema claro, que es el `defaultTheme`. Pinta la splash de Android; dentro
     * de la app manda `ThemeColorMeta`.
     */
    background_color: "#edf7ed",
    theme_color: "#edf7ed",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      /* Android recorta a la forma del launcher; éste trae fondo y margen. */
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
