import { afterEach, expect, test } from "bun:test"

import { appUrl, fromAddress } from "@/server/auth/email"

const KEYS = ["APP_URL", "VERCEL_ENV", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL", "RESEND_FROM_DOMAIN", "VERCEL"] as const
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

function env(values: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const k of KEYS) delete process.env[k]
  Object.assign(process.env, values)
}

test("en preview, los links de los emails van a la URL del branch y no a producción", () => {
  env({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "planti-git-feat.vercel.app", VERCEL_PROJECT_PRODUCTION_URL: "planti.app" })
  expect(appUrl()).toBe("https://planti-git-feat.vercel.app")
})

test("en producción, el dominio de producción", () => {
  env({ VERCEL_ENV: "production", VERCEL_BRANCH_URL: "planti-git-main.vercel.app", VERCEL_PROJECT_PRODUCTION_URL: "planti.app" })
  expect(appUrl()).toBe("https://planti.app")
})

test("APP_URL le gana a todo, y en local es localhost", () => {
  env({ APP_URL: "https://custom.dev/", VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "x.vercel.app" })
  expect(appUrl()).toBe("https://custom.dev")
  env({})
  expect(appUrl()).toBe("http://localhost:3000")
})

test("RESEND_FROM_DOMAIN es sólo el dominio", () => {
  env({ RESEND_FROM_DOMAIN: "planti.casa" })
  expect(fromAddress()).toBe("Planti <noreply@planti.casa>")
  env({ RESEND_FROM_DOMAIN: " planti.casa\n" }) // espacios al copiar y pegar
  expect(fromAddress()).toBe("Planti <noreply@planti.casa>")
})

test("RESEND_FROM_DOMAIN con otro formato falla diciendo qué valor tiene", () => {
  // El primero es el que rompió el primer deploy.
  for (const value of ["noreply@planti.casa", "https://planti.casa", "Planti"]) {
    env({ RESEND_FROM_DOMAIN: value })
    expect(() => fromAddress()).toThrow(`Tiene: ${JSON.stringify(value)}`)
  }
  env({ VERCEL: "1" })
  expect(() => fromAddress()).toThrow("Falta RESEND_FROM_DOMAIN")
  env({})
  expect(fromAddress()).toBe("Planti <onboarding@resend.dev>")
})
