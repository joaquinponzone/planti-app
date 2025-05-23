import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PlantProvider } from "@/components/plant-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import DataActions from "@/components/data-actions"
import { ConfigPopover } from "@/components/config-popover"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Planti - Keep your green friends alive!",
  description: "Planti is a simple app to help you take care of your plants. It's a place to store information about your plants, their care, and their growth.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <PlantProvider>
            <div className="min-h-screen bg-background text-foreground">
              <header className="container mx-auto p-4 pb-0 bg-background">
                <div className="flex justify-end gap-2">
                  <DataActions />
                  <ConfigPopover />
                  <ThemeToggle />
                </div>
              </header>
              {children}
              <Analytics />
              <Footer />
            </div>
          </PlantProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

