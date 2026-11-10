import { CARE_ACTIVITY_TYPES } from "./care"
import { z } from "./zod"

/** Texto opcional: vacío o sólo espacios se guarda como null, no como "". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Usá menos de ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null)

export const PlantSchema = z.object({
  name: z.string().trim().min(1, "Ponele un nombre a tu planta").max(100, "Usá menos de 100 caracteres"),
  scientificName: optionalText(100),
  location: optionalText(100),
  notes: optionalText(2000),
})

export const CareActivitySchema = z.object({
  plantId: z.string().min(1),
  type: z.enum(CARE_ACTIVITY_TYPES),
  notes: optionalText(2000),
})

export const ThresholdsSchema = z
  .object({
    warningDays: z.coerce.number().int("Usá días enteros").min(1, "Usá al menos 1 día").max(365, "Usá como mucho 365 días"),
    dangerDays: z.coerce.number().int("Usá días enteros").min(1, "Usá al menos 1 día").max(365, "Usá como mucho 365 días"),
  })
  .refine((t) => t.dangerDays > t.warningDays, {
    message: "El peligro tiene que llegar después del aviso",
    path: ["dangerDays"],
  })
