"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { FileUp, Loader2, Upload } from "lucide-react"

import { FormMessage } from "@/components/auth/auth-form"
import { Button } from "@/components/ui/button"
import { BackupError, planImportFromText, type ImportPlan } from "@/lib/backup"
import type { ImportResult } from "@/server/backup/import"

import { importBackup } from "../actions"

type Loaded = { name: string; text: string; plan: ImportPlan }

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function ImportView({ existingPlants }: { existingPlants: number }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [pending, start] = useTransition()

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = "" // permite volver a elegir el mismo archivo
    setError(null)
    setResult(null)
    setLoaded(null)
    if (!file) return
    try {
      const text = await file.text()
      // La vista previa usa la misma conversión que el servidor; el servidor
      // igual la vuelve a hacer al confirmar.
      setLoaded({ name: file.name, text, plan: planImportFromText(text) })
    } catch (e) {
      setError(e instanceof BackupError ? e.message : "No se pudo leer el archivo.")
    }
  }

  function confirm() {
    if (!loaded) return
    start(async () => {
      const response = await importBackup(loaded.text)
      if (response.error) setError(response.error)
      else if (response.result) {
        setResult(response.result)
        setLoaded(null)
      }
    })
  }

  if (result) {
    return (
      <div className="space-y-4">
        <FormMessage
          message={
            result.imported === 0
              ? "No había nada nuevo: todas las plantas del archivo ya estaban en tu cuenta."
              : `Listo: se agregaron ${plural(result.imported, "planta", "plantas")} y ${plural(result.activities, "cuidado", "cuidados")}.` +
                (result.skipped ? ` ${plural(result.skipped, "planta ya estaba", "plantas ya estaban")} y no se repitieron.` : "") +
                (result.settingsApplied ? " También se aplicaron las alertas de riego del backup." : "")
          }
        />
        <Link
          href="/"
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 border-2 border-black neo-brutalist-shadow transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          Ver mis plantas
        </Link>
      </div>
    )
  }

  const plan = loaded?.plan
  const activities = plan?.plants.reduce((n, p) => n + p.activities.length, 0) ?? 0

  return (
    <div className="space-y-6">
      <FormMessage error={error ?? undefined} />

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border-4 border-dashed border-black bg-background p-8 text-center hover:bg-primary/10 transition-colors">
        <FileUp className="h-8 w-8" />
        <span className="font-bold">{loaded ? loaded.name : "Elegir archivo"}</span>
        <span className="text-sm text-muted-foreground">planti-backup-….json</span>
        <input type="file" accept="application/json,.json" className="sr-only" onChange={handleFile} />
      </label>

      {plan && (
        <div className="space-y-4">
          <div className="border-2 border-black bg-card/30 p-4">
            <p className="text-lg font-bold">
              {plan.plants.length === 0
                ? "El archivo no tiene plantas."
                : `Se van a agregar ${plural(plan.plants.length, "planta", "plantas")} con ${plural(activities, "cuidado", "cuidados")}.`}
            </p>
            {plan.settings && (
              <p className="mt-1 text-sm">
                {existingPlants === 0
                  ? `Las alertas de riego pasan a ${plan.settings.warningDays} y ${plan.settings.dangerDays} días, como en el backup.`
                  : "Las alertas de riego del backup no se aplican: tu cuenta ya tiene plantas y se respeta tu configuración."}
              </p>
            )}
            {existingPlants > 0 && (
              <p className="mt-2 text-sm font-medium">
                Ya tenés {plural(existingPlants, "planta", "plantas")}. Las que ya estén en tu cuenta no se repiten.
              </p>
            )}
          </div>

          {plan.warnings.length > 0 && (
            <details className="border-2 border-black p-4">
              <summary className="cursor-pointer font-bold">
                {plural(plan.warnings.length, "cosa no se importa", "cosas no se importan")} tal cual
              </summary>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {plan.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}

          {plan.plants.length > 0 && (
            <Button
              onClick={confirm}
              disabled={pending}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold border-4 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              {pending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Upload className="mr-2 h-6 w-6" />}
              Importar {plural(plan.plants.length, "planta", "plantas")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
