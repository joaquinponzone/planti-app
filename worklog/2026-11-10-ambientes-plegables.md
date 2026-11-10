# Ambientes plegables

2026-11-10 · rama `feat/cuentas-db`

Decisión: [D-014](decisiones.md#d-014--ambientes-plegables-recordados-en-una-cookie-del-dispositivo)

## Por qué

Para quedarse con el ambiente donde uno está regando. Antes sólo se plegaban los
ambientes con todas las plantas al día; los que tenían alertas, no.

## Qué se hizo

- `components/plant-list.tsx`: todos los ambientes con el mismo encabezado. Es un `h2`
  que envuelve al botón (`aria-expanded`, foco visible) con la flecha, el nombre, ✓ o los
  contadores de peligro y aviso, y "N plantas" a la derecha. Plegado, los contadores
  siguen a la vista. "Plegar todos / Desplegar todos" junto a los chips del filtro,
  sólo si hay más de un ambiente a la vista.
- Los contadores pasaron de `Badge` (un `div`) a `span` con `badgeVariants`: un `div`
  no puede ir dentro de un botón.
- El nombre del ambiente usa `capitalize()` (la primera letra) en vez de la clase
  `capitalize` (cada palabra): "Sin ubicación" ya no se ve "Sin Ubicación".
- `lib/collapsed-locations.ts`: la cookie `planti_collapsed` (lista JSON de ambientes,
  un año, `samesite=lax`). `app/(app)/page.tsx` la lee y se la pasa a la lista.
- `tailwind.config.js`: animaciones `collapsible-down/up` (0,2 s) con la altura de Radix;
  con "reducir movimiento" no se animan. El contenido lleva `overflow-hidden` para animar
  la altura, con un margen de 8 px para no recortar la sombra de las tarjetas.
- `tests/collapsed-locations.test.ts`: valor codificado y sin codificar, cookie rota,
  tipos raros.

## Cómo se verificó

`bun dev` contra la base de prueba, con tres ambientes (Living, Taller, Balcón), con
`agent-browser`:

- Plegar Living: la cookie queda `["Living"]`. Al recargar sigue plegado, y el HTML del
  servidor ya llega sin sus plantas: no hay salto al cargar.
- "Plegar todos" deja los tres plegados, con sus contadores, y el botón pasa a
  "Desplegar todos".
- Con el filtro Peligro, "Desplegar todos" abre Taller y Balcón; Living, escondido por
  el filtro, sigue plegado al sacar el filtro.
- Teclado: Enter y Espacio pliegan y despliegan.
- Celular (390 px) en oscuro. Los dos avisos de Next en dev son los de siempre.
- `bun run lint`, `bun run typecheck`, `bun run test` (48 pass) y `bun run build`.

## No se probó

- La animación con "reducir movimiento" activado en el sistema (sólo se puso la clase).
- Con las plantas reales ni en el deploy.
