# Decisiones

La más nueva arriba. Una decisión revertida no se borra: se marca **reemplazada por** la nueva.

---

## D-009 · UI solo en español, sin framework de i18n

2026-11-10

**Decisión:** la pantalla, los emails y los mensajes de error están en español rioplatense
(voseo). Se adopta la regla de futclub: el dominio habla inglés, la pantalla habla español;
los valores del dominio se traducen una sola vez en `CARE_ACTIVITY_LABELS` (`lib/care.ts`).

**Por qué:** las dos usuarias hablan español. Un framework de i18n (`next-intl` o similar)
convierte cada texto en una clave de catálogo, exige detectar el idioma y escribir cada
texto y cada email N veces para siempre. Si aparece un público en otro idioma, pasar textos
inline a un catálogo es mecánico y acotado.

**Descartado:** varios idiomas con catálogo; quedarse en inglés (la app venía en inglés,
pero sus usuarias no).

## D-008 · La importación del backup es un script, no una función de la app

2026-11-10

**Decisión:** los datos de `localStorage` se pasan a la base con `scripts/import-backup.ts`
(paso 4b), que corre quien administra la app, una sola vez. La app no detecta ni ofrece
importar datos locales.

**Por qué:** según Vercel Analytics, Planti tiene una sola usuaria recurrente. Una
pantalla de importación (tarjeta, idempotencia, topes, detección de la planta de ejemplo)
sería código para un caso que no existe.

**Descartado:** mostrar las plantas locales en la lista con un indicador y un botón
"sincronizar". Obligaba a la UI a manejar dos tipos de planta, y eso es el modo dual de la
D-004 por la puerta de atrás.

## D-007 · Sin export/import de localStorage

2026-11-10

**Decisión:** se eliminó el menú Data (Import/Export de `localStorage`).

**Por qué:** con los datos en la base deja de tener sentido. Si hace falta un export de la
cuenta, se agrega como descarga desde el servidor.

## D-006 · Emails con Resend

2026-11-10

**Decisión:** Resend, con `RESEND_API_KEY` y `RESEND_FROM_DOMAIN` (el remitente es
`noreply@<dominio>`). En local, sin clave, los links se imprimen en la consola.

**Por qué:** ya se usa en matchday. Sin emails no hay forma de recuperar la contraseña.

## D-005 · Next 16 antes de portar el auth

2026-11-10

**Decisión:** actualizar de Next 14.2 a 16 (y React 19) antes de escribir el auth.

**Por qué:** el auth de futclub está escrito para Next 16 (`proxy.ts`, `await cookies()`).
Adaptarlo hacia atrás y después migrarlo de nuevo era hacer el trabajo dos veces.

**Detalle:** se eligió `16.4.3` y no la última (`16.4.6`, del día anterior): ninguna versión
con menos de dos semanas.

## D-004 · Cuenta obligatoria, sin modo local

2026-11-10

**Decisión:** para usar Planti hay que tener cuenta. No queda un modo "solo en este
navegador".

**Por qué:** mantener los dos modos implica dos implementaciones de cada operación, una UI
que contemple escrituras síncronas y asíncronas, y un modo local sin push (que es la razón
de esta etapa). Terminaría siendo una segunda Planti, peor, para casi nadie.

**Para quien cuida su privacidad:** se pide lo mínimo (email y contraseña).

## D-003 · Auth propio portado de futclub, no Better Auth

2026-11-10

**Decisión:** usuario y contraseña con la implementación de futclub (JWT con `jose`,
`sessionVersion`, tokens de un solo uso guardados como hash), pero con Server Actions en
lugar de Hono.

**Por qué:** ya está probada en producción y se conoce entera. Better Auth no es un
servicio externo (es una librería que guarda en la base propia), pero sumarla no aportaba
nada que esto no tuviera.

**Mejoras sobre futclub:** límite de intentos de login, un único `getSecret()` también para
el proxy, bcrypt contra un hash falso si el email no existe, el registro no revela si un
email ya tiene cuenta, contraseña de 8 caracteres a 72 bytes, y confirmar el email requiere
un clic (POST).

**Descartado:** iron-session (matchday, recomendados): un reset no cierra las sesiones
abiertas y no verifica el email.

## D-002 · Desarrollo contra una base local

2026-11-10

**Decisión:** en local, sin `TURSO_DATABASE_URL`, se usa `file:local.db`. En Vercel la
variable es obligatoria (sin ella el build falla). Las migraciones corren en el build, y un
deploy de preview se niega a migrar la base de producción.

**Por qué:** se puede romper y resetear la base local sin miedo, y producción solo cambia
al mergear a `main`.

## D-001 · Turso + Drizzle

2026-11-10

**Decisión:** SQLite en Turso, con Drizzle como ORM.

**Por qué:** la app se deploya en Vercel, y Turso tiene un driver que funciona desde
cualquier lado. Los datos son chicos y relacionales. Drizzle deja el esquema casi igual en
SQLite y Postgres, así que cambiar de proveedor después sería barato.

**Descartado:**
- **Cloudflare D1:** tiene sentido solo si la app corre en Workers; desde Vercel se accede
  por REST, más lento e incómodo.
- **Neon / Supabase (Postgres):** igual de válidos. Supabase traía auth incluido, pero ata
  más al proveedor y pausa los proyectos inactivos.
