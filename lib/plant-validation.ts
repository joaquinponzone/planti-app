import { z } from "zod"

import { CARE_ACTIVITY_TYPES } from "./care"

/** Texto opcional: vacío o sólo espacios se guarda como null, no como "". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null)

export const PlantSchema = z.object({
  name: z.string().trim().min(1, "Give your plant a name").max(100, "Keep it under 100 characters"),
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
    warningDays: z.coerce.number().int().min(1, "Use at least 1 day").max(365),
    dangerDays: z.coerce.number().int().min(1, "Use at least 1 day").max(365),
  })
  .refine((t) => t.dangerDays > t.warningDays, {
    message: "Danger has to be later than warning",
    path: ["dangerDays"],
  })
