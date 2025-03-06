"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePlants, type Plant } from "@/components/plant-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function EditPlant() {
  const params = useParams()
  const router = useRouter()
  const { getPlant, updatePlant } = usePlants()
  const [plant, setPlant] = useState<Plant | undefined>(undefined)
  const [formData, setFormData] = useState({
    name: "",
    scientificName: "",
    location: "",
    notes: "",
  })

  useEffect(() => {
    if (params.id) {
      const foundPlant = getPlant(params.id as string)
      if (foundPlant) {
        setPlant(foundPlant)
        setFormData({
          name: foundPlant.name,
          scientificName: foundPlant.scientificName || "",
          location: foundPlant.location || "",
          notes: foundPlant.notes || "",
        })
      } else {
        router.push("/")
      }
    }
  }, [params.id, getPlant, router])

  if (!plant) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updatePlant(plant.id, formData)
    router.push(`/plant/${plant.id}`)
  }

  return (
    <main className="container mx-auto p-4 md:p-8 pt-0">
      <div className="max-w-2xl mx-auto">
        <Button variant="link" className="inline-flex items-center mb-6 text-lg font-medium text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="border-4 border-black bg-neutral-100 dark:bg-neutral-800 mb-6 neo-brutalist-shadow">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 dark:text-neutral-200 border-b-4 border-black pb-2">Edit plant</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-2 border-black bg-card/30 dark:bg-card/20 h-12 px-4 neo-brutalist-shadow focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black"
                />
                <p className="text-sm text-muted-foreground">
                  If you don&apos;t know the name of the plant just type something that will help you identify it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientificName" className="text-base">
                  Scientific name
                </Label>
                <Input
                  id="scientificName"
                  value={formData.scientificName}
                  onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                  className="border-2 border-black bg-card/30 dark:bg-card/20 h-12 px-4 neo-brutalist-shadow focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black"
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="location" className="text-base">
                  Location / Room
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="border-2 border-black bg-card/30 dark:bg-card/20 h-12 px-4 neo-brutalist-shadow focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black"
                />
                <p className="text-sm text-muted-foreground">To group plants by location</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-lg">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="border-2 border-black bg-card/30 dark:bg-card/20 h-12 px-4 neo-brutalist-shadow focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black min-h-[100px] text-lg"
                  placeholder=""
                />
              </div>                

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="h-12 text-lg flex-1 border-2 border-black bg-primary text-primary-foreground hover:bg-primary/90 neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save changes
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="h-12 text-lg flex-1 border-2 border-black hover:bg-destructive/30 bg-neutral-100 dark:bg-neutral-900 hover:text-destructive-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

