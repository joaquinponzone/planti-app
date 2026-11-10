import Link from "next/link"
import { eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"

import { requireUser } from "@/lib/dal"
import { db } from "@/server/db"
import { plants } from "@/server/db/schema"

import { ImportView } from "./import-view"

export default async function ImportPage() {
  const user = await requireUser()
  // La vista previa avisa distinto si la cuenta ya tiene plantas: los
  // umbrales del backup no se aplican, y un backup viejo puede duplicar.
  const existingPlants = await db.$count(plants, eq(plants.userId, user.id))

  return (
    <main className="container mx-auto p-4 md:p-8 pt-0">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center mb-6 text-lg font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a las plantas
        </Link>

        <div className="border-4 border-black bg-white dark:bg-neutral-800 p-6 md:p-8 neo-brutalist-shadow">
          <h1 className="text-3xl font-bold mb-2 border-b-4 border-black pb-2">Importar un backup</h1>
          <p className="mb-6 text-muted-foreground">
            Elegí un archivo exportado de Planti, de esta versión o de la anterior. Las plantas se agregan a las que ya
            tenés; no se borra ni se cambia nada.
          </p>
          <ImportView existingPlants={existingPlants} />
        </div>
      </div>
    </main>
  )
}
