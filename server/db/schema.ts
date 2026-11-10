import { sql } from "drizzle-orm"
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import {
  CARE_ACTIVITY_TYPES,
  DEFAULT_DANGER_DAYS,
  DEFAULT_WARNING_DAYS,
  SCHEDULE_TYPES,
} from "../../lib/care"

/*
 * Convenciones:
 * - ids: UUID en texto, generados en el servidor. Los ids de la versión local
 *   (`Date.now().toString()`) chocan entre usuarios, así que la importación
 *   genera ids nuevos en vez de reutilizarlos.
 * - fechas: `timestamp_ms` (entero en milisegundos), que Drizzle expone como `Date`.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())

const inList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(", "))

/* -------------------------------------------------------------------------- */
/* Cuentas                                                                     */
/* -------------------------------------------------------------------------- */

export const users = sqliteTable("users", {
  id: id(),
  /** Siempre normalizado (trim + minúsculas) antes de escribir o buscar. */
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** null mientras la cuenta espera que el dueño confirme el email. */
  emailVerifiedAt: integer("email_verified_at", { mode: "timestamp_ms" }),
  /** Viaja como `sv` en el JWT. Incrementarlo revoca todas las sesiones y los avisos push. */
  sessionVersion: integer("session_version").notNull().default(1),

  // Preferencias. Son pocas y siempre se leen junto con el usuario: una tabla
  // aparte sólo agregaría un join.
  warningDays: integer("warning_days").notNull().default(DEFAULT_WARNING_DAYS),
  dangerDays: integer("danger_days").notNull().default(DEFAULT_DANGER_DAYS),
  /** IANA. Define qué es "hoy" para el recordatorio diario. */
  timezone: text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
  /**
   * Fecha local (YYYY-MM-DD) del último recordatorio enviado. Hace idempotente
   * al cron: si Vercel lo reintenta, nadie recibe el aviso dos veces.
   */
  lastReminderOn: text("last_reminder_on"),

  lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

/**
 * Tokens de confirmación de email y de recuperación de contraseña. Sólo se
 * guarda el SHA-256: el token crudo viaja en el email y no se puede
 * reconstruir desde una filtración de la DB.
 */
export const authTokens = sqliteTable(
  "auth_tokens",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose", { enum: ["verify_email", "reset_password"] }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    consumedAt: integer("consumed_at", { mode: "timestamp_ms" }),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("auth_tokens_user_purpose_idx").on(t.userId, t.purpose),
    index("auth_tokens_created_idx").on(t.createdAt),
  ],
)

/**
 * Intentos de login fallidos, para frenar fuerza bruta. Se cuentan por email
 * y por IP dentro de una ventana; las filas viejas se purgan solas al
 * registrar intentos nuevos. No tiene FK a `users` a propósito: también se
 * registran intentos contra emails que no existen.
 */
export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: id(),
    email: text("email").notNull(),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [
    index("login_attempts_email_idx").on(t.email, t.createdAt),
    index("login_attempts_ip_idx").on(t.ip, t.createdAt),
  ],
)

/**
 * Un dispositivo suscripto a avisos push. "Tiene los avisos activados" es que
 * exista una fila: un flag aparte se desincroniza apenas el navegador vence la
 * suscripción.
 */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Único: si el mismo navegador entra con otra cuenta, la fila se reasigna. */
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    /** `users.sessionVersion` al suscribir. Sólo se envía si todavía coincide. */
    sessionVersion: integer("session_version").notNull(),
    createdAt: createdAt(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("push_subscriptions_user_idx").on(t.userId)],
)

/* -------------------------------------------------------------------------- */
/* Plantas                                                                     */
/* -------------------------------------------------------------------------- */

export const plants = sqliteTable(
  "plants",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    scientificName: text("scientific_name"),
    location: text("location"),
    notes: text("notes"),
    /** null = activa. Una fecha en vez de un booleano: dice además cuándo se archivó. */
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("plants_user_idx").on(t.userId)],
)

/**
 * Historial de cuidados. No guarda `userId`: la pertenencia se resuelve por la
 * planta, y toda consulta pasa por ella. Un `userId` duplicado acá podría
 * quedar contradiciendo al de la planta.
 *
 * Reemplaza también a `Plant.lastWatered` de la versión local: el último riego
 * es el último `watered` de esta tabla.
 */
export const careActivities = sqliteTable(
  "care_activities",
  {
    id: id(),
    plantId: text("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    type: text("type", { enum: CARE_ACTIVITY_TYPES }).notNull(),
    notes: text("notes"),
    performedAt: integer("performed_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("care_activities_plant_idx").on(t.plantId, t.performedAt),
    check("care_activities_type_chk", sql`${t.type} in (${inList(CARE_ACTIVITY_TYPES)})`),
  ],
)

/**
 * Rutinas de cuidado. Una por tipo y planta: la versión local permitía
 * duplicarlas, pero dos "riego cada N días" para la misma planta no tienen
 * sentido y harían que el recordatorio la cuente dos veces.
 *
 * `nextDueAt` se guarda, aunque se pueda calcular, porque es lo que consulta
 * el cron de recordatorios y necesita un índice.
 */
export const schedules = sqliteTable(
  "schedules",
  {
    id: id(),
    plantId: text("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    type: text("type", { enum: SCHEDULE_TYPES }).notNull(),
    frequencyDays: integer("frequency_days").notNull(),
    lastPerformedAt: integer("last_performed_at", { mode: "timestamp_ms" }).notNull(),
    nextDueAt: integer("next_due_at", { mode: "timestamp_ms" }).notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("schedules_plant_type_uq").on(t.plantId, t.type),
    index("schedules_due_idx").on(t.enabled, t.nextDueAt),
    check("schedules_type_chk", sql`${t.type} in (${inList(SCHEDULE_TYPES)})`),
    check("schedules_frequency_chk", sql`${t.frequencyDays} > 0`),
  ],
)

/**
 * Fotos en Vercel Blob. Las fotos de la versión local no se migran: eran
 * `URL.createObjectURL`, que deja de existir al recargar la página.
 */
export const plantPhotos = sqliteTable(
  "plant_photos",
  {
    id: id(),
    plantId: text("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    /** Ruta dentro del blob store, para poder borrarla. */
    pathname: text("pathname").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("plant_photos_plant_idx").on(t.plantId, t.createdAt)],
)

export type User = typeof users.$inferSelect
export type Plant = typeof plants.$inferSelect
export type CareActivity = typeof careActivities.$inferSelect
export type Schedule = typeof schedules.$inferSelect
export type PlantPhoto = typeof plantPhotos.$inferSelect
