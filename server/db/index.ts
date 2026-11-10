import "server-only"

import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import * as schema from "./schema"
import { databaseUrl } from "./url"

// Las foreign keys (y con ellas los `onDelete: cascade`) vienen prendidas tanto
// en Turso como en los archivos locales de @libsql/client: no hace falta PRAGMA.
const client = createClient({ url: databaseUrl(), authToken: process.env.TURSO_AUTH_TOKEN })

export const db = drizzle(client, { schema })
