import { afterEach, expect, test } from "bun:test"

import { appUrl } from "@/server/auth/email"

const KEYS = ["APP_URL", "VERCEL_ENV", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"] as const
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
