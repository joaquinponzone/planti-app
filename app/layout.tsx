import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PlantProvider } from "@/components/plant-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import DataActions from "@/components/data-actions"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Planti - Plant Care Tracking App",
  description: "Track watering and care schedules for your indoor plants",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <PlantProvider>
            <div className="min-h-screen bg-background text-foreground">
              <header className="container mx-auto p-4 pb-0 bg-background">
                <div className="flex justify-end gap-2">
                  <DataActions />
                  <ThemeToggle />
                </div>
              </header>
              {children}
            </div>
          </PlantProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

