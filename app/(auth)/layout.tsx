import type React from "react"

import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="container mx-auto p-4 pb-0">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <p className="text-4xl font-black tracking-tight mb-1">Planti</p>
          <p className="text-lg font-medium text-muted-foreground mb-8">Keep your green friends alive!</p>
          {children}
        </div>
      </main>
    </>
  )
}
