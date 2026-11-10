import { describe, expect, test } from "bun:test"

import { parseCollapsedLocations } from "@/lib/collapsed-locations"

describe("parseCollapsedLocations", () => {
  test("sin cookie, nada plegado", () => {
    expect(parseCollapsedLocations(undefined)).toEqual([])
    expect(parseCollapsedLocations("")).toEqual([])
  })

  test("lee el valor ya decodificado (como lo entrega Next)", () => {
    expect(parseCollapsedLocations('["Living","Balcón"]')).toEqual(["Living", "Balcón"])
  })

  test("lee el valor codificado (como lo escribe el navegador)", () => {
    const raw = encodeURIComponent(JSON.stringify(["Taller", "Sin ubicación", "100% sol"]))
    expect(parseCollapsedLocations(raw)).toEqual(["Taller", "Sin ubicación", "100% sol"])
  })

  test("una cookie rota o con otra forma es 'nada plegado', no un error", () => {
    expect(parseCollapsedLocations("no-es-json")).toEqual([])
    expect(parseCollapsedLocations('{"Living":true}')).toEqual([])
    expect(parseCollapsedLocations("%E0%A4%A")).toEqual([])
  })

  test("descarta lo que no es texto", () => {
    expect(parseCollapsedLocations('["Living",3,null]')).toEqual(["Living"])
  })
})
