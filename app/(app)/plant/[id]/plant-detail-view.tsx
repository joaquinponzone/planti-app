"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Droplet,
  Pill,
  FlowerIcon,
  SprayCanIcon as Spray,
  Leaf,
  MoveRight,
  Flower2,
  Scissors,
  X,
  Loader2,
} from "lucide-react"

import { CareActivityDialog, ACTIVITIES_WITH_NOTES } from "@/components/care/care-activity-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CARE_ACTIVITY_LABELS, CARE_ACTIVITY_TYPES, type CareActivityType } from "@/lib/care"

import { addCareActivity, removeCareActivity } from "../../actions"

// Los íconos son presentación de esta pantalla; las etiquetas salen del
// diccionario (`CARE_ACTIVITY_LABELS`), que es el único lugar donde se traducen.
const ICONS: Record<CareActivityType, React.ReactNode> = {
  watered: <Droplet className="h-5 w-5" />,
  medicated: <Pill className="h-5 w-5" />,
  fertilized: <FlowerIcon className="h-5 w-5" />,
  misted: <Spray className="h-5 w-5" />,
  wiped: <Leaf className="h-5 w-5" />,
  moved: <MoveRight className="h-5 w-5" />,
  repotted: <Flower2 className="h-5 w-5" />,
  pruned: <Scissors className="h-5 w-5" />,
}

const CARE_ACTIVITIES = CARE_ACTIVITY_TYPES.map((type) => ({ type, icon: ICONS[type], label: CARE_ACTIVITY_LABELS[type] }))

const activityButtonClass =
  "w-full text-black h-12 md:h-10 border-2 border-black justify-start hover:bg-primary/30 bg-neutral-100 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"

type Activity = { id: string; type: CareActivityType; notes: string | null; when: string }

/** Botón de un cuidado sin notas: se registra con un clic. */
function QuickActivityButton({ plantId, activity }: { plantId: string; activity: (typeof CARE_ACTIVITIES)[number] }) {
  const [pending, start] = useTransition()
  return (
    <Button
      onClick={() => start(async () => void (await addCareActivity({ plantId, type: activity.type })))}
      disabled={pending}
      variant="outline"
      className={activityButtonClass}
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : activity.icon}
      <span className="ml-2">{activity.label}</span>
    </Button>
  )
}

export function PlantDetailView({
  plant,
  activities,
}: {
  plant: { id: string; name: string; location: string | null }
  activities: Activity[]
}) {
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null)
  const [deleting, startDeleting] = useTransition()

  const confirmDelete = () => {
    const id = activityToDelete
    if (!id) return
    startDeleting(async () => {
      await removeCareActivity(plant.id, id)
      setActivityToDelete(null)
    })
  }

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

        <div className="border-4 border-black bg-card dark:bg-card/10 mb-6 neo-brutalist-shadow">
          <div className="p-4 flex items-center">
            <div className="w-16 h-16 flex items-center justify-center bg-black text-white text-3xl font-bold mr-4">
              {plant.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-grow">
              <h1 className="text-2xl font-bold">{plant.name}</h1>
              {plant.location && <p className="text-sm italic">{plant.location}</p>}
            </div>

            <div className="flex gap-2">
              <Link href={`/plant/${plant.id}/edit`}>
                <Button
                  variant="outline"
                  className="border-2 border-black hover:bg-primary/30 bg-neutral-100 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-black"
                >
                  Editar planta
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-lg font-bold">Registrar un cuidado</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pb-4">
          {CARE_ACTIVITIES.filter((a) => !ACTIVITIES_WITH_NOTES.includes(a.type)).map((activity) => (
            <QuickActivityButton key={activity.type} plantId={plant.id} activity={activity} />
          ))}
          {CARE_ACTIVITIES.filter((a) => ACTIVITIES_WITH_NOTES.includes(a.type)).map((activity) => (
            <CareActivityDialog
              key={activity.type}
              plantId={plant.id}
              activityType={activity.type}
              trigger={
                <Button variant="outline" className={activityButtonClass}>
                  {activity.icon}
                  <span className="ml-2">{activity.label}</span>
                </Button>
              }
            />
          ))}
        </div>

        <div className="border-4 border-black bg-card/20 neo-brutalist-shadow">
          <h2 className="p-4 text-xl font-bold border-b-2 border-black bg-secondary dark:text-neutral-900">Historial de cuidados</h2>

          {activities.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground"> - Todavía no hay cuidados registrados - </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {activities.map((activity) => {
                const info = CARE_ACTIVITIES.find((a) => a.type === activity.type)
                return (
                  <div key={activity.id} className="p-4 flex items-center justify-between group">
                    <div className="flex items-center">
                      {info?.icon}
                      <div className="ml-3">
                        <p className="font-medium">{info?.label}</p>
                        <p className="text-sm text-muted-foreground">{activity.when}</p>
                      </div>
                    </div>
                    {activity.notes && (
                      <div className="ml-3">
                        <p className="text-sm font-semibold">Notas:</p>
                        <p className="text-sm text-muted-foreground">{activity.notes}</p>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActivityToDelete(activity.id)}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Borrar del historial</span>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
        <DialogContent className="border-4 border-black dark:border-white bg-card neo-brutalist-shadow sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Borrar del historial</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              ¿Seguro que querés borrar este cuidado? No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setActivityToDelete(null)}
              className="flex-1 sm:flex-none border-2 border-black hover:bg-neutral-300 bg-neutral-100 dark:bg-neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 sm:flex-none border-2 border-black bg-destructive text-destructive-foreground hover:bg-destructive/90 neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
