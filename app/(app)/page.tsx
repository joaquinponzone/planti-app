import Link from "next/link"
import { PlusCircle } from "lucide-react"

import PlantList, { type PlantCardData } from "@/components/plant-list"
import { requireUser } from "@/lib/dal"
import { daysAgo } from "@/lib/dates"
import { listPlants } from "@/server/plants/queries"

export default async function Home() {
  const user = await requireUser()
  const now = new Date()

  // Los días se calculan acá, una sola vez, y viajan como número: si los
  // calculara el componente, el render del servidor y la hidratación podrían
  // caer a ambos lados de la medianoche y no coincidir.
  const plants: PlantCardData[] = (await listPlants(user.id)).map((p) => ({
    id: p.id,
    name: p.name,
    location: p.location,
    needsCare: p.needsCare,
    daysSinceLastWatered: p.lastWateredAt ? daysAgo(p.lastWateredAt, now, user.timezone) : null,
  }))

  return (
    <main className="container mx-auto p-4 md:p-8 pt-0">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight border-b-4 border-black dark:border-primary pb-2 mb-2">Planti</h1>
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-3">
            <p className="text-lg font-medium text-muted-foreground">¡Mantené vivas a tus plantas!</p>
            <Link
              href="/add-plant"
              className="flex items-center gap-2 bg-primary/30 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 border-2 border-black neo-brutalist-shadow transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none w-fit"
            >
              <PlusCircle size={20} />
              <span>Agregar planta</span>
            </Link>
          </div>
        </header>

        <PlantList plants={plants} thresholds={{ warningDays: user.warningDays, dangerDays: user.dangerDays }} />
      </div>
    </main>
  )
}
