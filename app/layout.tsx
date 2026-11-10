import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Planti · ¡Mantené vivas a tus plantas!",
  description: "Planti es una app simple para cuidar tus plantas: anotá cuándo las regaste, fertilizaste o trasplantaste, y mirá cuáles hace mucho que no riegás.",
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
