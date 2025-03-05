"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePlants } from "@/components/plant-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Leaf } from "lucide-react"
import Link from "next/link"

export default function AddPlant() {
  const router = useRouter()
  const { addPlant } = usePlants()
  const [formData, setFormData] = useState({
    name: "",
    scientificName: "",
    location: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addPlant(formData)
    router.push("/")
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center mb-6 text-lg font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to plants
        </Link>

        <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6 md:p-8 neo-brutalist-shadow">
          <h1 className="text-3xl font-bold mb-6 border-b-4 border-black pb-2">New plant</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="border-2 border-black dark:border-white bg-background h-12 text-lg"
                placeholder="Kitchen window plant"
              />
              <p className="text-sm text-muted-foreground">
                If you don&apos;t know the name of the plant just type something that will help you identify it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scientificName" className="text-lg">
                Scientific name
              </Label>
              <Input
                id="scientificName"
                name="scientificName"
                value={formData.scientificName}
                onChange={handleChange}
                className="border-2 border-black dark:border-white bg-background h-12 text-lg"
                placeholder="Scientific name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-lg">
                Location / Room
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="border-2 border-black dark:border-white bg-background h-12 text-lg"
                placeholder="No location"
              />
              <p className="text-sm text-muted-foreground">To group plants by location</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-lg">
                Note
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="border-2 border-black dark:border-white bg-background min-h-[100px] text-lg"
                placeholder=""
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 mt-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold border-4 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <Leaf className="mr-2 h-6 w-6" />
              Create Plant
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}

