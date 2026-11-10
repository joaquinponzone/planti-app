import type { Config } from "drizzle-kit"

import { databaseUrl } from "./server/db/url"

export default {
  dialect: "turso",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dbCredentials: {
    url: databaseUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config
