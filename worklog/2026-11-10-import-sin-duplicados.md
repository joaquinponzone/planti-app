# Importar dos veces un backup viejo ya no duplica

2026-11-10 · rama `feat/cuentas-db`

Decisión: [D-015](decisiones.md#d-015--un-backup-viejo-se-reconoce-por-nombre-ubicación-e-historial)

## Por qué

En el demo, importar más de una vez el backup real (formato viejo, 44 plantas) dejó 121.
Para ese formato, `applyImport` le daba a cada planta un id al azar: nada la reconocía
la segunda vez. La pantalla avisaba ("si ya lo importaste, se van a duplicar"), pero
dejaba seguir.

## Qué se hizo

- `server/backup/import.ts`: para las plantas sin `sourceId` (formato viejo), carga las
  plantas de la cuenta con su historial y saltea las que ya están (`findLegacyMatch`:
  mismo nombre y ubicación, historial que contiene todos los cuidados del archivo; cada
  planta de la cuenta empareja con una sola). Sólo consulta si la cuenta tiene plantas.
- `app/(app)/import/import-view.tsx` y `scripts/import-backup.ts`: el aviso de "se van a
  duplicar" pasa a "las que ya estén en tu cuenta no se repiten". El resultado ya decía
  cuántas se saltearon.
- `tests/backup.test.ts`: el backup real dos veces, regar entre una importación y otra,
  mismo nombre con otra ubicación u otro historial, dos plantas iguales en el archivo, y
  una creada a mano con el mismo nombre.

## Cómo se verificó

- Los 5 tests nuevos pasan. Con el `import.ts` de antes del arreglo fallan 3 (los que
  reproducen el bug); los otros 2 cuidan que no se saltee de más.
- `bun run lint`, `bun run typecheck`, `bun run test` (53 pass).

## No se probó

- En la pantalla ni en el deploy: sólo con tests.
- Las 121 plantas que ya están en la cuenta del demo no se tocan. Se borran a mano y se
  vuelve a importar.
