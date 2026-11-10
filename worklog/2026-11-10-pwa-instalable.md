# PWA instalable

2026-11-10 · rama `feat/cuentas-db`

Decisión: [D-011](decisiones.md#d-011--pwa-instalable-sin-service-worker-por-ahora)

## Por qué

Paso 5 del roadmap: poder instalar Planti en la pantalla de inicio y abrirla sin la barra
del navegador. Es además el prerrequisito de las push (paso 6): en iOS sólo llegan con la
app instalada. Se siguió lo que ya funciona en futclub (`worklog/2026-08-05-pwa-instalable.md`
de ese repo).

## Qué se hizo

- `app/manifest.ts`: Next lo sirve en `/manifest.webmanifest`. `display: "standalone"`,
  `start_url: "/"`, colores del tema claro (`#edf7ed`, el `--background` de `globals.css`).
- `lib/plant-mark.ts`: la maceta del favicon redibujada en SVG. El favicon es un PNG de
  96 px y estirado a 512 se ve borroso.
- `scripts/generate-pwa-icons.ts` (`bun run icons`): rasteriza ese SVG con `sharp`
  (devDependency, mismo rango que la opcional de Next). Salen `public/icons/icon-192.png`
  e `icon-512.png` (con el borde blanco del favicon, transparentes),
  `icon-maskable-512.png` (fondo verde claro y margen para el recorte de Android) y
  `app/apple-icon.png` de 180 (fondo sólido: iOS aplana la transparencia contra negro).
  Los PNG se commitean.
- `app/layout.tsx`: `manifest`, `applicationName`, `appleWebApp` (`statusBarStyle:
  "default"`), el `apple-mobile-web-app-capable` prefijado para iOS < 16.4, y `viewport`
  con `themeColor` claro/oscuro.
- `components/theme-color-meta.tsx`: pisa el `theme-color` con el tema elegido en la app
  (el del `<meta>` depende del tema del sistema). Lee el token `--background`, que en
  Planti guarda sólo los componentes HSL, así que lo envuelve en `hsl()`.

El proxy no se tocó: ya dejaba pasar `manifest.webmanifest`, `sw.js` y los `.png`.

## Verificación

- `bun run lint`, `bunx tsc --noEmit -p .`, `bun run test` (37 pass).
- Con `bun dev` y **sin sesión**: `/manifest.webmanifest` → 200
  `application/manifest+json`; los tres íconos y `/apple-icon.png` → 200 `image/png`;
  `/` sigue redirigiendo (307) al login.
- El HTML de `/login` emite `<link rel="manifest">`, `apple-touch-icon` de 180,
  `mobile-web-app-capable`, `apple-mobile-web-app-capable`, el título y los dos
  `theme-color`.
- Los PNG se miraron a tamaño real, al lado del favicon.

## Qué no se probó

- **En un celular real**: instalar desde Android Chrome (menú → Instalar) e iOS Safari
  (Compartir → Agregar a inicio), que el ícono sea la maceta y que la barra de estado
  acompañe al tema.
- `bun run build` (necesita las variables de Turso).

## Quedó afuera

- **El service worker.** Va con las push (paso 6), que es lo único que lo necesita. Sin
  SW la app instalada no abre sin red, y no puede haber un botón "Instalar" propio
  (`beforeinstallprompt` pide un SW con handler de `fetch`); se instala desde el menú del
  navegador.
- El `badge-96.png` de los avisos: se suma al script cuando existan.
