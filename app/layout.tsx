import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeColorMeta } from "@/components/theme-color-meta"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Planti · ¡Mantené vivas a tus plantas!",
  description: "Planti es una app simple para cuidar tus plantas: anotá cuándo las regaste, fertilizaste o trasplantaste, y mirá cuáles hace mucho que no riegás.",
  applicationName: "Planti",
  manifest: "/manifest.webmanifest",
  /*
   * `capable` es lo que hace que iOS abra en standalone desde "Agregar a
   * inicio". Con `default`, iOS pinta la barra de estado con el `theme-color`
   * y el contenido empieza debajo de ella: no hace falta compensar el notch.
   *
   * iOS congela esto al agregar la app a inicio: un cambio acá no se ve
   * recargando, sino borrando el ícono y volviéndolo a agregar.
   */
  appleWebApp: {
    capable: true,
    title: "Planti",
    statusBarStyle: "default",
  },
  /*
   * `capable: true` emite sólo `mobile-web-app-capable`, que lee iOS 16.4+.
   * Abajo de esa versión hace falta el prefijado para abrir en standalone.
   */
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /*
   * El primer paint, cuando sólo se sabe el tema del sistema. Al hidratar,
   * `ThemeColorMeta` los pisa con el tema elegido en la app. Son los
   * `--background` de `globals.css`.
   */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf7ed" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <ThemeColorMeta />
          <div className="min-h-screen bg-background text-foreground">
            {children}
            <Analytics />
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
