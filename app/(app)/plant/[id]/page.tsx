import { notFound } from "next/navigation"

import { requireUser } from "@/lib/dal"
import { formatDateTime } from "@/lib/dates"
import { getPlant } from "@/server/plants/queries"

import { PlantDetailView } from "./plant-detail-view"

export default async function PlantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const plant = await getPlant(user.id, id)
  // Una planta ajena da 404, igual que una inexistente: no se distingue cuál de las dos.
  if (!plant) notFound()

  return (
    <PlantDetailView
      plant={{ id: plant.id, name: plant.name, location: plant.location }}
      activities={plant.activities.map((a) => ({
        id: a.id,
        type: a.type,
        notes: a.notes,
        // Formateada en el servidor con la zona del usuario: ver lib/dates.ts.
        when: formatDateTime(a.performedAt, user.timezone),
      }))}
    />
  )
}
