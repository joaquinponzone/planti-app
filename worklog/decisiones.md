# Decisiones

La más nueva arriba. Una decisión revertida no se borra: se marca **reemplazada por** la nueva.

---

## D-012 · Formularios con `useFormAction`, no `useActionState` directo

2026-11-10

**Decisión:** todo `<form action={...}>` con campos que se tipean usa `useFormAction`
(`lib/use-form-action.ts`). Recuerda lo enviado y los campos lo usan de `defaultValue`.

**Por qué:** React 19 resetea el formulario cuando termina la acción, también si el
servidor devolvió un error. Con `useActionState` solo, el mensaje de error aparecía con
los campos vueltos a lo guardado (umbrales, editar planta) o vacíos (el email del login).
Se vio en la pasada por el navegador; ningún test lo cubría.

**Reglas:**
- `keep` lista los campos a recordar. Nunca una contraseña: quedaría escrita en el DOM.
- Los campos siguen sin controlar (`defaultValue`, no `value` + `onChange`): el reset usa
  el `defaultValue` del último render, que ya trae lo enviado.

**Descartado:** devolver los valores desde la Server Action (los manda ida y vuelta por la
red sin necesidad) y pasar los formularios a controlados (un `useState` por campo en
cada formulario).

## D-011 · PWA instalable, sin service worker por ahora

2026-11-10

**Decisión:** manifest, íconos y metadata de iOS, como en futclub. Sin service worker
hasta las push (paso 6), y cuando llegue, sin handler de `fetch`.

**Por qué:** instalar y abrir sin barra del navegador no necesita SW. El único uso que
tiene planeado es recibir push; cachear páginas con datos de la cuenta abre problemas
(datos viejos, otra cuenta en el mismo dispositivo) que no resuelven nada pedido.

**Reglas:**
- Los íconos salen de `lib/plant-mark.ts` con `bun run icons` y se commitean. No se
  dibujan aparte: la marca es una sola.
- `statusBarStyle: "default"`: el contenido arranca debajo de la barra de estado y no
  hace falta `viewport-fit: cover` ni compensar `safe-area-inset`. Si algún día hay una
  barra inferior fija, revisar.
- `manifest.webmanifest` y `sw.js` siguen exentos en el matcher de `proxy.ts`.

**Descartado:** escalar el favicon de 96 px (borroso), `next-pwa` (sin mantenimiento, no
soporta Next 16).

## D-010 · Exportar e importar los datos de la cuenta, desde la app

2026-11-10

**Decisión:** cada usuario puede descargar sus datos (`/api/export`, formato v2) e
importar un backup (`/import`), tanto v2 como el formato viejo de `localStorage`.
Importar **sólo agrega**: nunca borra ni modifica. Reemplaza en parte a D-007 y D-008.

**Por qué:** es portabilidad de los datos de la cuenta, no un resto del modo local
(lo que descartó D-007). Y resuelve el backup de la usuaria sin que el admin tenga que
correr un script por ella.

**Reglas:**
- Vista previa en el navegador con la misma conversión (`lib/backup.ts`); el servidor
  la vuelve a hacer al confirmar y no acepta lo que arma el cliente.
- Importar dos veces el mismo archivo v2 no duplica, sea de la propia cuenta o de otra
  (ids derivados de cuenta + id original). El formato viejo no lo permite: la vista
  previa avisa si la cuenta ya tiene plantas.
- Umbrales y zona horaria del backup se aplican **sólo si la cuenta está vacía**.
- Todo en un único `batch`: un viaje a la base y atómico.

**Descartado:** "reemplazar todo" (un archivo equivocado borraría la cuenta).
`scripts/import-backup.ts` se mantiene como herramienta de administración, sobre el
mismo código.

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

> **Reemplazada por D-010:** la importación pasó a la app. El script queda como
> herramienta de administración.

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

> **En parte reemplazada por D-010:** volvió el export/import, pero de los datos de la
> cuenta y desde el servidor.

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
