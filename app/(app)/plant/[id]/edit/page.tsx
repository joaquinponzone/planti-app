import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PlantForm } from "@/components/plant-form"
import { requireUser } from "@/lib/dal"
import { getPlant } from "@/server/plants/queries"

import { updatePlant } from "../../../actions"

export default async function EditPlant({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const plant = await getPlant(user.id, id)
  // Una planta ajena da 404, igual que una inexistente: no se distingue cuál de las dos.
  if (!plant) notFound()

  return (
    <main className="container mx-auto p-4 md:p-8 pt-0">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/plant/${plant.id}`}
          className="inline-flex items-center mb-6 text-lg font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>

        <div className="border-4 border-black bg-neutral-100 dark:bg-neutral-800 mb-6 neo-brutalist-shadow">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 dark:text-neutral-200 border-b-4 border-black pb-2">Edit plant</h1>
            <PlantForm
              action={updatePlant.bind(null, plant.id)}
              initial={{ name: plant.name, scientificName: plant.scientificName, location: plant.location, notes: plant.notes }}
              mode="edit"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
