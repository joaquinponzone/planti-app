import { describe, expect, test } from "bun:test"

import { getWateringStatus, parseWateringStatuses } from "@/lib/care"

const thresholds = { warningDays: 14, dangerDays: 30 }

describe("getWateringStatus", () => {
  test("los umbrales son inclusivos: el día exacto ya cuenta", () => {
    expect(getWateringStatus(13, thresholds)).toBe("ok")
    expect(getWateringStatus(14, thresholds)).toBe("warning")
    expect(getWateringStatus(29, thresholds)).toBe("warning")
    expect(getWateringStatus(30, thresholds)).toBe("danger")
  })

  test("regada hoy está al día", () => {
    expect(getWateringStatus(0, thresholds)).toBe("ok")
  })

  test("nunca regada no tiene estado: no es lo mismo que estar al día", () => {
    expect(getWateringStatus(null, thresholds)).toBeNull()
  })
})

describe("parseWateringStatuses", () => {
  test("sin parámetro, sin filtro", () => {
    expect(parseWateringStatuses(null)).toEqual([])
    expect(parseWateringStatuses("")).toEqual([])
  })

  test("devuelve los estados en el orden de los chips, sin importar el de la URL", () => {
    expect(parseWateringStatuses("ok,danger")).toEqual(["danger", "ok"])
  })

  test("ignora valores desconocidos y repetidos", () => {
    expect(parseWateringStatuses("danger,peligro,danger,<script>")).toEqual(["danger"])
  })
})
