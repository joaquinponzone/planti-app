"use client"

import { usePlants, type Plant } from "./plant-provider"
import { Droplet, MoreVertical, NotebookText, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

export default function PlantList() {
  const { plants, addCareActivity, deletePlant } = usePlants()
  const [plantToDelete, setPlantToDelete] = useState<string | null>(null)

  const activePlants = plants.filter((plant) => !plant.archived)
    .map(plant => ({
      ...plant,
      lastWatered: plant.careLog
        .filter(log => log.type === "watered")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date || null
    }))
    .sort((a, b) => {
      // Plants without watering history go first
      if (!a.lastWatered && !b.lastWatered) return 0
      if (!a.lastWatered) return -1
      if (!b.lastWatered) return 1
      // Sort by oldest watering date first
      return new Date(a.lastWatered).getTime() - new Date(b.lastWatered).getTime()
    })

  // Check if plant needs care
  /**
   * Determines if a plant needs care based on its care schedules.
   * 
   * This function checks if any of the plant's enabled care schedules
   * have a nextDue date that has passed (is less than or equal to the current date).
   * If the plant has no schedules, it's considered not needing care.
   * 
   * @param plant - The plant to check
   * @returns true if the plant needs care, false otherwise
   */
  const needsCare = (plant: Plant): boolean => {
    if (plant.schedules.length === 0) return false

    const now = new Date()
    return plant.schedules.some((schedule) => {
      if (!schedule.enabled) return false
      const nextDue = new Date(schedule.nextDue)
      return nextDue <= now
    })
  }

  if (activePlants.length === 0) {
    return (
      <div className="border-4 border-black p-8 text-center bg-secondary neo-brutalist-shadow">
        <h3 className="text-xl font-bold mb-4">No plants yet!</h3>
        <p className="mb-4 text-muted-foreground">Add your first plant to start tracking.</p>
        <Link
          href="/add-plant"
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 border-2 border-black neo-brutalist-shadow transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          Add Plant
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {activePlants.map((plant) => {
        const requiresCare = needsCare(plant)

        return (
          <div
            key={plant.id}
            className={`border-4 ${
              requiresCare ? "border-destructive" : "border-black"
            } bg-card dark:bg-primary/10 text-card-foreground overflow-hidden neo-brutalist-shadow`}
          >
            <div className="flex items-center p-4">
              {/* <div
                className={`w-16 h-16 flex items-center justify-center text-primary-foreground text-3xl font-bold mr-4 ${requiresCare ? "bg-destructive" : "bg-primary"}`}
              >
                {getInitial(plant.name)}
              </div> */}

              <div className="flex-grow">
                <span className="flex gap-2 items-center">
                  <h3 className="text-xl font-bold">{plant.name}</h3>
                  {plant.location && <p className="text-sm text-muted-foreground dark:text-primary"> - {plant.location}</p>}
                </span>
                <hr className="my-2 w-3/4 border-2 border-black" />
                <div className="flex flex-col gap-1">
                  {plant.lastWatered && (
                    <p className="text-sm">
                      Last watered: <span className="text-black dark:text-white font-bold font-mono">{new Date(plant.lastWatered).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => addCareActivity(plant.id, { type: "watered" })}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  size="icon"
                >
                  <Droplet className="h-5 w-5" />
                  <span className="sr-only">Water</span>
                </Button>

                <Link href={`/plant/${plant.id}`}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-2 border-black hover:bg-primary hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  >
                    <NotebookText className="h-5 w-5" />
                    <span className="sr-only">NotebookText</span>
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-2 border-black hover:bg-primary hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    >
                      <MoreVertical className="h-5 w-5" />
                      <span className="sr-only">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border-2 border-black">
                    <DropdownMenuItem className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      <Pencil className="h-4 w-4 mr-2" />
                      <Link href={`/plant/${plant.id}/edit`} className="flex w-full">
                        Edit plant
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive hover:text-destructive-foreground hover:bg-destructive"
                      onSelect={() => setPlantToDelete(plant.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {requiresCare && (
              <div className="bg-destructive/20 p-3 text-sm font-medium border-t-2 border-destructive">Care needed</div>
            )}
          </div>
        )
      })}

      <AlertDialog open={!!plantToDelete} onOpenChange={() => setPlantToDelete(null)}>
        <AlertDialogContent className="border-2 border-black neo-brutalist-shadow">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your plant and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-black"
              onClick={() => {
                if (plantToDelete) {
                  deletePlant(plantToDelete)
                  setPlantToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

