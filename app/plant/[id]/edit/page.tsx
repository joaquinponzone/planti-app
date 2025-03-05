"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePlants, type Plant } from "@/components/plant-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditPlant() {
  const params = useParams()
  const router = useRouter()
  const { getPlant, updatePlant } = usePlants()
  const [plant, setPlant] = useState<Plant | undefined>(undefined)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  })

  useEffect(() => {
    if (params.id) {
      const foundPlant = getPlant(params.id as string)
      if (foundPlant) {
        setPlant(foundPlant)
        setFormData({
          name: foundPlant.name,
          location: foundPlant.location || "",
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
        <Link
          href={`/plant/${plant.id}`}
          className="inline-flex items-center mb-6 text-lg font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to plant
        </Link>

        <div className="border-4 border-black bg-card/30 mb-6 neo-brutalist-shadow">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-6 dark:text-neutral-200">Edit plant</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">
                  Plant name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-2 border-black bg-neutral-100 dark:bg-neutral-900 h-12 px-4 neo-brutalist-shadow focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-base">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="border-2 border-black bg-neutral-100 dark:bg-neutral-900 h-12 px-4 neo-brutalist-shadow focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 border-2 border-black bg-primary text-primary-foreground hover:bg-primary/90 neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                >
                  Save changes
                </Button>
                <Link href={`/plant/${plant.id}`} className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-black hover:bg-destructive/30 bg-neutral-100 dark:bg-neutral-900 hover:text-destructive-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

