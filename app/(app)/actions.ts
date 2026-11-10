"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireUser } from "@/lib/dal"
import { CareActivitySchema, PlantSchema, ThresholdsSchema } from "@/lib/plant-validation"
import * as plants from "@/server/plants/mutations"

/**
 * Server Actions de la app. Cada una:
 * 1. pide el usuario con `requireUser()` (nunca confía en un id del cliente),
 * 2. valida la entrada con zod,
 * 3. delega en `server/plants/mutations`, que filtra por `userId`,
 * 4. revalida las páginas que muestran el dato.
 */

export type ActionState = { error?: string }

function plantFields(formData: FormData) {
  return PlantSchema.safeParse({
    name: formData.get("name"),
    scientificName: formData.get("scientificName"),
    location: formData.get("location"),
    notes: formData.get("notes"),
  })
}

export async function createPlant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  const parsed = plantFields(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await plants.createPlant(user.id, parsed.data)
  revalidatePath("/")
  redirect("/")
}

export async function updatePlant(plantId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  const parsed = plantFields(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (!(await plants.updatePlant(user.id, plantId, parsed.data))) return { error: "No encontramos esa planta" }
  revalidatePath("/")
  revalidatePath(`/plant/${plantId}`)
  redirect(`/plant/${plantId}`)
}

export async function deletePlant(plantId: string): Promise<void> {
  const user = await requireUser()
  await plants.deletePlant(user.id, plantId)
  revalidatePath("/")
}

export async function addCareActivity(input: { plantId: string; type: string; notes?: string | null }): Promise<ActionState> {
  const user = await requireUser()
  const parsed = CareActivitySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { plantId, type, notes } = parsed.data
  if (!(await plants.addCareActivity(user.id, plantId, type, notes))) return { error: "No encontramos esa planta" }
  revalidatePath("/")
  revalidatePath(`/plant/${plantId}`)
  return {}
}

export async function removeCareActivity(plantId: string, activityId: string): Promise<void> {
  const user = await requireUser()
  await plants.removeCareActivity(user.id, activityId)
  revalidatePath("/")
  revalidatePath(`/plant/${plantId}`)
}

export async function updateThresholds(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  const parsed = ThresholdsSchema.safeParse({
    warningDays: formData.get("warningDays"),
    dangerDays: formData.get("dangerDays"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await plants.updateThresholds(user.id, parsed.data.warningDays, parsed.data.dangerDays)
  revalidatePath("/")
  return {}
}
