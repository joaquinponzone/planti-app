# Plantas en la base

2026-11-10 · rama `feat/cuentas-db` · commit `d7231f8`

Decisiones: [D-007](decisiones.md#d-007--sin-exportimport-de-localstorage), [D-008](decisiones.md#d-008--la-importación-del-backup-es-un-script-no-una-función-de-la-app)

## Por qué

Con cuentas, las plantas tienen que vivir en la base y no en el navegador.

## Qué se hizo

**Servidor**
- `server/plants/queries.ts` (`listPlants`, `getPlant`) y `server/plants/mutations.ts`:
  todas reciben `userId` y lo ponen en el WHERE de la misma consulta. No hay un "chequear
  y después escribir" que pueda desfasarse.
- `app/(app)/actions.ts`: cada Server Action llama a `requireUser()`, valida con zod
  (`lib/plant-validation.ts`), delega y revalida.
- Registrar un cuidado adelanta la rutina de ese tipo usando `SCHEDULE_FOR_ACTIVITY`.

**Pantallas**
- Las páginas leen en el servidor y pasan datos a componentes de cliente. Agregar y editar
  comparten `components/plant-form.tsx`. Una planta ajena da 404, igual que una inexistente.
- `lib/dates.ts`: fechas con `users.timezone`. Hace falta porque ahora las fechas se
  renderizan también en el servidor (UTC) y la hidratación no coincidiría. "Last watered"
  cuenta días de calendario.
- Se eliminaron `plant-provider`, el menú Data, `RepottingDialog` (sin uso) y la pestaña
  Photos (vuelve en el paso 7).

## Bug encontrado al probar

Las subconsultas de `listPlants` decían `"plant_id" = "id"`: dentro de un `select`, Drizzle
escribe las columnas sin tabla, y ese `"id"` era el de la tabla interna. "Last watered"
salía siempre vacío y "Care needed" no aparecía nunca, sin ningún error. El orden de la
lista salía bien por casualidad (en el `ORDER BY` sí va la tabla), así que en la pantalla no
se notaba. Se corrigió con `qualified()`, que escribe `"tabla"."columna"`.

**Regla:** en una subconsulta correlacionada con `sql\`\``, nombrar siempre las columnas con
su tabla.

## Cómo se verificó

- 7 tests de la capa de datos: aislamiento entre usuarios (leer, editar, borrar, agregar y
  quitar cuidados), fertilizar adelanta su rutina y no la de riego, orden y archivadas,
  cascada, días de calendario con zona horaria, validación.
- Por HTTP con dos usuarios: crear y editar desde los formularios; nombre vacío
  rechazado; Bob recibe 404 en la planta de Ana; **reenviar el formulario de edición de Ana
  con la cookie de Bob no cambia nada**.
- **No probado:** los botones de un clic (regar, cuidados rápidos, borrar), el diálogo con
  notas y el popover de umbrales necesitan navegador. Su lógica está cubierta por los tests.

## Pendiente

- 4b: script de importación del backup.
- Pantalla para crear rutinas (paso 6).
