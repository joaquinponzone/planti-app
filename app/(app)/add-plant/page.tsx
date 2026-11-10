import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PlantForm } from "@/components/plant-form"

import { createPlant } from "../actions"

export default function AddPlant() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center mb-6 text-lg font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a las plantas
        </Link>

        <div className="border-4 border-black bg-white dark:bg-neutral-800 p-6 md:p-8 neo-brutalist-shadow">
          <h1 className="text-3xl font-bold mb-6 border-b-4 border-black pb-2">Nueva planta</h1>
          <PlantForm action={createPlant} mode="create" />
        </div>
      </div>
    </main>
  )
}
