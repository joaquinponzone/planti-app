"use client"

import { usePlants, type Plant, type PlantStatusThresholds } from "./plant-provider"
import { Droplet, MoreVertical, NotebookText, Trash2, Pencil, ChevronsUpDown, AlarmClockCheck, ListChecks } from "lucide-react"
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
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "./ui/badge"

// Create a reusable RelativeTimeFormat instance
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

// Extend Plant type locally to include calculated daysSinceLastWatered
interface PlantWithWateringStatus extends Plant {
  lastWateredDate: string | null;
  daysSinceLastWatered: number | null;
}

export default function PlantList() {
  const { plants, addCareActivity, deletePlant, plantStatusThresholds } = usePlants()
  const [plantToDelete, setPlantToDelete] = useState<string | null>(null)

  const activePlants: PlantWithWateringStatus[] = plants
    .filter((plant) => !plant.archived)
    .map((plant) => {
      const lastWateredLog = plant.careLog
        .filter((log) => log.type === "watered")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const lastWateredDate = lastWateredLog?.date || null;
      const daysSinceLastWatered = lastWateredDate
        ? Math.floor((new Date().getTime() - new Date(lastWateredDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        ...plant,
        lastWateredDate,
        daysSinceLastWatered,
      };
    })
    .sort((a, b) => {
      if (!a.lastWateredDate && !b.lastWateredDate) return 0;
      if (!a.lastWateredDate) return -1;
      if (!b.lastWateredDate) return 1;
      return new Date(a.lastWateredDate).getTime() - new Date(b.lastWateredDate).getTime();
    });

  // Check if plant needs care based on schedules (unchanged)
  const needsCare = (plant: Plant): boolean => {
    if (plant.schedules.length === 0) return false
    const now = new Date()
    return plant.schedules.some((schedule) => {
      if (!schedule.enabled) return false
      const nextDue = new Date(schedule.nextDue)
      return nextDue <= now
    })
  }

  // Check plant watering status (for coloring/collapsible logic)
  const getWateringStatus = (days: number | null, thresholds: PlantStatusThresholds): 'green' | 'warning' | 'danger' => {
    if (days === null) return 'green'; // Treat never watered as green for this logic
    if (days >= thresholds.dangerDays) return 'danger';
    if (days >= thresholds.warningDays) return 'warning';
    return 'green';
  };

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

  // Group plants by location
  const groupedPlants = activePlants.reduce<Record<string, PlantWithWateringStatus[]>>((acc, plant) => {
    const key = plant.location || 'Unassigned';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(plant);
    return acc;
  }, {});

  // Plant card component (now receives PlantWithWateringStatus)
  const PlantCard = ({ plant }: { plant: PlantWithWateringStatus }) => {
    const requiresCare = needsCare(plant as Plant);
    const wateringStatus = getWateringStatus(plant.daysSinceLastWatered, plantStatusThresholds);

    const backgroundColorClass = cn(
      "bg-card dark:bg-primary/20",
      {
        "bg-yellow-200/50 dark:bg-yellow-900/50": wateringStatus === 'warning',
        "bg-red-200/50 dark:bg-red-900/50": wateringStatus === 'danger',
      },
    );

    return (
      <div
        key={plant.id}
        className={cn(
          `border-4 ${requiresCare ? "border-destructive" : "border-black"} text-card-foreground overflow-hidden neo-brutalist-shadow`,
          backgroundColorClass
        )}
      >
        <div className="flex items-center p-4">
          <div className="flex-grow">
            <span className="flex gap-2 items-center">
              <h3 className="text-xl font-bold">{plant.name}</h3>
            </span>
            <hr className="my-2 w-3/4 border-2 border-black" />
            <div className="flex flex-col gap-1">
              {plant.lastWateredDate && (
                <p className="text-sm">
                  Last watered: <span className="text-black dark:text-white font-bold font-mono">
                    {plant.daysSinceLastWatered === null
                      ? 'Never'
                      : plant.daysSinceLastWatered === 0
                      ? 'Today'
                      : rtf.format(-plant.daysSinceLastWatered, 'day')}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => addCareActivity(plant.id, { type: "watered" })}
              className={cn(
                "bg-blue-500 hover:bg-blue-600 text-white border-2 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all",
                {
                  "animate-pulse": wateringStatus === 'warning',
                  "animate-bounce": wateringStatus === 'danger',
                },
              )}
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
                <span className="sr-only">Details</span>
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
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedPlants).map(([location, plantsInLocation]) => {
        // Check if ALL plants in this location are green
        const allPlantsGreen = plantsInLocation.every(
          (plant) => getWateringStatus(plant.daysSinceLastWatered, plantStatusThresholds) === 'green'
        );

        const plantsInDanger = plantsInLocation.filter(
          (plant) => getWateringStatus(plant.daysSinceLastWatered, plantStatusThresholds) === 'danger'
        );

        const plantsInWarning = plantsInLocation.filter(
          (plant) => getWateringStatus(plant.daysSinceLastWatered, plantStatusThresholds) === 'warning'
        );

        const plantGrid = (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plantsInLocation.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        );

        return (
          <div key={location} className="space-y-3">
            {allPlantsGreen ? (
              <Collapsible defaultOpen={true}>
                <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-lg font-semibold capitalize hover:text-muted-foreground dark:hover:text-accent transition-colors border-b-4 border-black pb-1">
                      {location}
                      <span className="flex items-center gap-2">
                        <ListChecks className="size-5 text-black p-0" />
                        <Badge className="size-6 p-0.5 border-2 border-black">
                          <ChevronsUpDown className="size-5 text-black p-0" />
                        </Badge>
                      </span>
                    </button>

                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                 {plantGrid}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <h2 className="flex items-center gap-2 text-lg font-semibold capitalize border-b-4 border-black w-fit pb-1">
                  {location}
                  <span className="flex items-center gap-2">
                    <AlarmClockCheck className="size-5" />
                    {plantsInDanger.length > 0 ? <Badge variant="destructive">
                      {plantsInDanger.length}
                    </Badge> : null}
                    {plantsInWarning.length > 0 ? <Badge className="bg-yellow-500">
                      {plantsInWarning.length}
                    </Badge> : null}
                  </span>
                </h2>
                {plantGrid}
              </>
            )}
          </div>
        );
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
