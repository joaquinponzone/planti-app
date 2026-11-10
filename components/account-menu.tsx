import Link from "next/link"
import { Download, LogOut, Upload, UserRound } from "lucide-react"

import { logout } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const itemClass =
  "flex items-center text-black h-10 px-4 font-bold text-sm border-2 border-black justify-between w-full hover:bg-primary/30 bg-neutral-100 neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"

export function AccountMenu({ email }: { email: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Cuenta"
          className="border-2 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          <UserRound className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="mt-2 w-64 p-4 border-4 bg-card border-black neo-brutalist-shadow">
        <p className="text-xs text-muted-foreground">Sesión iniciada como</p>
        <p className="mb-4 truncate font-bold">{email}</p>
        <div className="flex flex-col gap-2">
          {/* <a> y no <Link>: es una descarga, no una navegación de la app. */}
          <a href="/api/export" download className={itemClass}>
            Exportar mis datos <Download className="h-4 w-4" />
          </a>
          <Link href="/import" className={itemClass}>
            Importar un backup <Upload className="h-4 w-4" />
          </Link>
          <form action={logout} className="mt-2">
            <button type="submit" className={itemClass}>
              Salir <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
