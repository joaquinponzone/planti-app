"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export type CareActivity = {
  id: string
  type: "watered" | "medicated" | "fertilized" | "misted" | "wiped" | "moved" | "repotted" | "pruned"
  date: string // ISO date string
  notes?: string
}

export type Schedule = {
  id: string
  type: "watering" | "medication" | "fertilization" | "misting" | "wiping" | "moving" | "repotting" | "pruning"
  frequency: number // in days
  lastPerformed: string // ISO date string
  nextDue: string // ISO date string
  enabled: boolean
}

export type Plant = {
  id: string
  name: string
  scientificName?: string
  location?: string
  notes?: string
  imageUrls: string[]
  schedules: Schedule[]
  careLog: CareActivity[]
  archived: boolean
}

type PlantContextType = {
  plants: Plant[]
  addPlant: (plant: Omit<Plant, "id" | "schedules" | "careLog" | "imageUrls" | "archived">) => void
  updatePlant: (id: string, updates: Partial<Plant>) => void
  deletePlant: (id: string) => void
  archivePlant: (id: string) => void
  getPlant: (id: string) => Plant | undefined
  addCareActivity: (plantId: string, activity: Omit<CareActivity, "id" | "date">) => void
  removeCareActivity: (plantId: string, activityId: string) => void
  addSchedule: (plantId: string, schedule: Omit<Schedule, "id" | "lastPerformed" | "nextDue" | "enabled">) => void
  addPhoto: (plantId: string, imageUrl: string) => void
  removePhoto: (plantId: string, imageUrl: string) => void
}

const PlantContext = createContext<PlantContextType | undefined>(undefined)

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([])

  // Load plants from localStorage on initial render
  useEffect(() => {
    const savedPlants = localStorage.getItem("plants")
    if (savedPlants) {
      setPlants(JSON.parse(savedPlants))
    } else {
      // Add sample plant if none exist
      const samplePlant: Plant = {
        id: "1",
        name: "Pandu",
        scientificName: "",
        location: "Living Room",
        notes: "",
        imageUrls: [],
        schedules: [],
        careLog: [],
        archived: false,
      }
      setPlants([samplePlant])
      localStorage.setItem("plants", JSON.stringify([samplePlant]))
    }
  }, [])

  // Save plants to localStorage whenever they change
  useEffect(() => {
    if (plants.length > 0) {
      localStorage.setItem("plants", JSON.stringify(plants))
    }
  }, [plants])

  const addPlant = (plant: Omit<Plant, "id" | "schedules" | "careLog" | "imageUrls" | "archived">) => {
    const newPlant: Plant = {
      ...plant,
      id: Date.now().toString(),
      schedules: [],
      careLog: [],
      imageUrls: [],
      archived: false,
    }
    setPlants([...plants, newPlant])
  }

  const updatePlant = (id: string, updates: Partial<Plant>) => {
    setPlants(plants.map((plant) => (plant.id === id ? { ...plant, ...updates } : plant)))
  }

  const deletePlant = (id: string) => {
    setPlants(plants.filter((plant) => plant.id !== id))
  }

  const archivePlant = (id: string) => {
    setPlants(plants.map((plant) => (plant.id === id ? { ...plant, archived: true } : plant)))
  }

  const getPlant = (id: string) => {
    return plants.find((plant) => plant.id === id)
  }

  const addCareActivity = (plantId: string, activity: Omit<CareActivity, "id" | "date">) => {
    const newActivity: CareActivity = {
      ...activity,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    }

    setPlants(
      plants.map((plant) =>
        plant.id === plantId
          ? {
              ...plant,
              careLog: [newActivity, ...plant.careLog],
              // Update schedule if this activity type has a schedule
              schedules: plant.schedules.map((schedule) =>
                schedule.type === `${activity.type}ing` ||
                (activity.type === "watered" && schedule.type === "watering") ||
                (activity.type === "wiped" && schedule.type === "wiping")
                  ? {
                      ...schedule,
                      lastPerformed: newActivity.date,
                      nextDue: new Date(Date.now() + schedule.frequency * 24 * 60 * 60 * 1000).toISOString(),
                    }
                  : schedule,
              ),
            }
          : plant,
      ),
    )
  }

  const removeCareActivity = (plantId: string, activityId: string) => {
    setPlants(
      plants.map((plant) =>
        plant.id === plantId
          ? {
              ...plant,
              careLog: plant.careLog.filter((activity) => activity.id !== activityId),
            }
          : plant,
      ),
    )
  }

  const addSchedule = (plantId: string, schedule: Omit<Schedule, "id" | "lastPerformed" | "nextDue" | "enabled">) => {
    const now = new Date()
    const newSchedule: Schedule = {
      ...schedule,
      id: Date.now().toString(),
      lastPerformed: now.toISOString(),
      nextDue: new Date(now.getTime() + schedule.frequency * 24 * 60 * 60 * 1000).toISOString(),
      enabled: true,
    }

    setPlants(
      plants.map((plant) =>
        plant.id === plantId ? { ...plant, schedules: [...plant.schedules, newSchedule] } : plant,
      ),
    )
  }

  const addPhoto = (plantId: string, imageUrl: string) => {
    setPlants(
      plants.map((plant) => (plant.id === plantId ? { ...plant, imageUrls: [...plant.imageUrls, imageUrl] } : plant)),
    )
  }

  const removePhoto = (plantId: string, imageUrl: string) => {
    setPlants(
      plants.map((plant) => {
        if (plant.id === plantId) {
          return {
            ...plant,
            imageUrls: plant.imageUrls.filter((url) => url !== imageUrl)
          }
        }
        return plant
      })
    )
  }

  return (
    <PlantContext.Provider
      value={{
        plants,
        addPlant,
        updatePlant,
        deletePlant,
        archivePlant,
        getPlant,
        addCareActivity,
        removeCareActivity,
        addSchedule,
        addPhoto,
        removePhoto,
      }}
    >
      {children}
    </PlantContext.Provider>
  )
}

export function usePlants() {
  const context = useContext(PlantContext)
  if (context === undefined) {
    throw new Error("usePlants must be used within a PlantProvider")
  }
  return context
}

