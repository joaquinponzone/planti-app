"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePlants, type Plant, type CareActivity } from "@/components/plant-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  PlusIcon,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function PlantDetail() {
  const params = useParams()
  const router = useRouter()
  const { getPlant, addCareActivity, removeCareActivity, addPhoto, removePhoto } = usePlants()
  const [plant, setPlant] = useState<Plant | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("logs")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (params.id) {
      const foundPlant = getPlant(params.id as string)
      if (foundPlant) {
        setPlant(foundPlant)
      } else {
        router.push("/")
      }
    }
  }, [params.id, getPlant, router])

  if (!plant) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const careActivities = [
    { type: "watered", icon: <Droplet className="h-5 w-5" />, label: "Watered" },
    { type: "medicated", icon: <Pill className="h-5 w-5" />, label: "Medicated" },
    { type: "fertilized", icon: <FlowerIcon className="h-5 w-5" />, label: "Fertilized" },
    { type: "misted", icon: <Spray className="h-5 w-5" />, label: "Misted" },
    { type: "wiped", icon: <Leaf className="h-5 w-5" />, label: "Wiped leaves" },
    { type: "moved", icon: <MoveRight className="h-5 w-5" />, label: "Moved" },
    { type: "repotted", icon: <Flower2 className="h-5 w-5" />, label: "Repotted" },
    { type: "pruned", icon: <Scissors className="h-5 w-5" />, label: "Pruned" },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleAddActivity = (type: CareActivity["type"]) => {
    addCareActivity(plant.id, { type })
    // Refresh plant data
    setPlant(getPlant(plant.id))
  }

  const handleRemoveActivity = (activityId: string) => {
    setActivityToDelete(activityId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (activityToDelete) {
      removeCareActivity(plant.id, activityToDelete)
      setPlant(getPlant(plant.id))
      setIsDeleteDialogOpen(false)
      setActivityToDelete(null)
    }
  }

  const handleAddPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Create a URL for preview
    const imageUrl = URL.createObjectURL(file)
    
    // Add the photo to the plant
    addPhoto(plant.id, imageUrl)
    
    // Refresh plant data
    setPlant(getPlant(plant.id))
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <main className="container mx-auto p-4 md:p-8 pt-0">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center mb-6 text-lg font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to plants
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
                  Edit plant
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-12 w-full bg-card/20 border-4 border-black relative">
            <TabsTrigger
              value="logs"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Logs
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Photos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4">
            <Collapsible className="mb-4">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="h-16 text-neutral-900 dark:text-neutral-200 w-full border-2 border-black justify-between hover:bg-primary/30 bg-neutral-100 dark:bg-card/10 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  <span className="text-xl font-bold">Add activity</span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {careActivities.map((activity) => (
                    <Button
                      key={activity.type}
                      onClick={() => handleAddActivity(activity.type as CareActivity["type"])}
                      variant="outline"
                      className="h-12 md:h-8 border-2 border-black justify-start hover:bg-primary/30 bg-neutral-100 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    >
                      {activity.icon}
                      <span className="ml-2">{activity.label}</span>
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="border-4 border-black bg-card/20 neo-brutalist-shadow">
              <h2 className="p-4 text-xl font-bold border-b-2 border-black bg-card dark:text-neutral-900">Activity log</h2>

              {plant.careLog.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No activities recorded yet</div>
              ) : (
                <div className="divide-y-2 divide-black">
                  {plant.careLog.map((activity) => {
                    const activityInfo = careActivities.find((a) => a.type === activity.type)

                    return (
                      <div key={activity.id} className="p-4 flex items-center justify-between group">
                        <div className="flex items-center">
                          {activityInfo?.icon}
                          <div className="ml-3">
                            <p className="font-medium">{activityInfo?.label}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveActivity(activity.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove activity</span>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <div className="border-4 border-black bg-card/40 dark:bg-card/20 p-4 neo-brutalist-shadow">
              <h2 className="text-xl font-bold mb-4 dark:text-neutral-200">{plant.imageUrls.length} Photos</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {plant.imageUrls.map((url, index) => (
                  <div key={index} className="aspect-square relative bg-background border-2 border-black group">
                    <Image
                      src={url}
                      alt={`${plant.name} photo ${index + 1}`}
                      className="object-cover w-full h-full"
                      width={300}
                      height={300}
                      priority={index === 0}
                    />
                    <button
                      onClick={() => {
                        removePhoto(plant.id, url)
                        setPlant(getPlant(plant.id))
                      }}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/90"
                      title="Remove photo"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove photo</span>
                    </button>
                  </div>
                ))}

                <label 
                  className="aspect-square flex flex-col items-center justify-center border-4 border-dashed border-black bg-background hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <Input 
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleAddPhoto}
                  />
                  <PlusIcon className="w-8 h-8 text-black dark:text-neutral-200" />
                  <span className="mt-2 text-black dark:text-neutral-200">Add photo</span>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-4 border-black dark:border-white bg-card neo-brutalist-shadow sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete activity</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Are you sure you want to remove this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 sm:flex-none border-2 border-black hover:bg-neutral-300 bg-neutral-100 dark:bg-neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 sm:flex-none border-2 border-black bg-destructive text-destructive-foreground hover:bg-destructive/90 neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

