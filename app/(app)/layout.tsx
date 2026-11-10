import type React from "react"

import { AccountMenu } from "@/components/account-menu"
import { ConfigPopover } from "@/components/config-popover"
import DataActions from "@/components/data-actions"
import { PlantProvider } from "@/components/plant-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { requireUser } from "@/lib/dal"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Valida la sesión contra la base al entrar. No alcanza como autorización
  // de los datos: el layout no se vuelve a ejecutar al navegar entre páginas,
  // así que cada Server Action que lea o escriba datos llama a `requireUser()`
  // por su cuenta.
  const user = await requireUser()

  return (
    <PlantProvider>
      <header className="container mx-auto p-4 pb-0 bg-background">
        <div className="flex justify-end gap-2">
          <DataActions />
          <ConfigPopover />
          <ThemeToggle />
          <AccountMenu email={user.email} />
        </div>
      </header>
      {children}
    </PlantProvider>
  )
}
