# Exportar e importar los datos de la cuenta

2026-11-10 · rama `feat/cuentas-db`

Decisión: [D-010](decisiones.md#d-010--exportar-e-importar-los-datos-de-la-cuenta-desde-la-app)

## Por qué

Para no perder la función de "guardar tu backup / llevarte tus datos" que tenía la
versión vieja, y para que la usuaria con datos en `localStorage` los suba ella misma.

## Qué se hizo

- `lib/backup.ts`: el formato v2, `planImport` y `planImportFromText`. Reemplaza a
  `scripts/backup-transform.ts`, ahora también para el formato v2, con topes (900 KB, 1000
  plantas, 50 000 cuidados) y errores claros (`BackupError`).
- `server/backup/export.ts`: `buildExport`, todos los datos del usuario (archivadas
  incluidas), sin email ni datos de la cuenta.
- `server/backup/import.ts`: `applyImport`, sólo agrega, en un único `batch`.
- `app/api/export/route.ts`: la descarga, `planti-backup-AAAAMMDD.json` (fecha en la zona
  del usuario). Valida la sesión contra la base: una sesión revocada recibe 401.
- `app/(app)/import/`: elegir archivo → vista previa (plantas, cuidados, qué pasa con los
  umbrales, avisos) → confirmar. La Server Action `importBackup` recibe el texto y lo
  vuelve a convertir.
- Menú de cuenta: "Exportar mis datos" e "Importar un backup".
- `scripts/import-backup.ts`: usa el mismo código. Ya no se niega si la cuenta tiene
  plantas (sólo agrega, como la app); avisa si el formato no permite detectar duplicados.

## Bugs encontrados al probar con el backup real

- **~90 viajes a la base por importación.** El `applyImport` anterior hacía dos consultas
  por planta. Con 44 plantas y las funciones en São Paulo contra Turso en Virginia eran
  segundos de espera. Ahora todo va en un `batch`.
- **Importar dos veces el backup de otra cuenta duplicaba todo.** Los ids del archivo eran
  de la cuenta de origen, así que la destino recibía ids al azar y no los reconocía la
  segunda vez. Ahora el id es un hash de cuenta destino + id original: siempre el mismo.
  El test que lo cubre falla con la lógica anterior (verificado).

## Cómo se verificó

- 37 tests en verde (12 nuevos de backup): ida y vuelta entre cuentas, reimportar sin
  duplicar (propio y ajeno), umbrales sólo en cuenta vacía, el export no trae plantas
  ajenas ni el email, atomicidad (una sentencia que falla no deja nada), un backup
  sintético del tamaño del real, archivos inválidos y topes.
- Con el **backup real** (44 plantas, 620 cuidados, 97 KB, no está en el repo): conversión
  sin avisos; importado en una cuenta con la app levantada (44 tarjetas en la home,
  umbrales 35/45); export por HTTP con 44 y 620 y sin el email; `/api/export` sin sesión
  redirige al login; ese export importado dos veces en otra cuenta → 44 y después 0.
- **No probado:** la pantalla `/import` con clics (la vista previa y el botón necesitan
  navegador; su lógica es la de los tests).
