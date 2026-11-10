# Filtro por estado de riego

2026-11-10 · rama `feat/cuentas-db`

Decisión: [D-013](decisiones.md#d-013--filtro-por-estado-de-riego-en-la-url-y-con-los-nombres-de-los-umbrales)

## Por qué

Con muchas plantas en varios ambientes, las que hay que regar quedan repartidas entre
grupos y hay que scrollear todo para juntarlas.

## Qué se hizo

- `lib/care.ts`: `WateringStatus` (`danger`, `warning`, `ok`), `WATERING_STATUS_LABELS`
  ("Peligro", "Aviso", "Al día"), `getWateringStatus` (antes vivía en `plant-list.tsx`) y
  `parseWateringStatuses` para leer `?status=`. El estado de una planta nunca regada
  pasa de `"green"` a `null`: la tarjeta se ve igual, pero no cuenta para ningún chip.
- `components/watering-filter.tsx`: tres chips con muestra de color, nombre y cantidad.
  El activo queda hundido (sin sombra y corrido, el gesto de "apretado" de la app) y
  toma el fondo de las tarjetas de ese estado. `aria-pressed`, foco visible, y
  deshabilitado si no hay plantas en ese estado. En celular, los tres en una fila.
- `components/plant-list.tsx`: lee el filtro con `useSearchParams`, lo cambia con
  `history.replaceState` y agrupa sólo las plantas visibles. Si el filtro deja la lista
  vacía: "Ninguna planta con ese estado." y un botón "Ver todas".
- `tests/care.test.ts`: umbrales inclusivos, nunca regada sin estado, y parseo del
  parámetro (orden, valores desconocidos, repetidos).

## Cómo se verificó

`bun dev` contra una base SQLite de prueba con 10 plantas en dos ambientes (52 a 7 días
sin riego, una nunca regada), con `agent-browser`:

- Sin filtro: Peligro 4, Aviso 2, Al día 3. La nunca regada no suma en ninguno.
- Peligro + Aviso: la URL queda `?status=danger,warning`, se ven las 6 del Taller y el
  Living desaparece. `aria-pressed` correcto en los tres.
- Recargar y volver desde el detalle de una planta conservan el filtro.
- Con sólo Aviso, regar las dos plantas las saca de la lista y actualiza los números
  (Aviso 0, Al día 5). Queda el estado vacío y el chip Aviso sigue apretado.
- Celular (390 px) en claro y en oscuro.
- Los dos avisos de Next en dev son los de antes (`next-themes` y la hidratación del
  botón "Cuenta"); el filtro no suma ninguno.
- `bun run lint`, `bun run typecheck`, `bun run test` (43 pass) y `bun run build`.

## No se probó

- Con las 44 plantas reales ni en el deploy.
- Con teclado más allá de que el foco se vea: no se recorrió la lista entera con Tab.
