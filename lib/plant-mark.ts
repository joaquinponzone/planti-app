/**
 * La maceta de Planti, en SVG.
 *
 * Es el mismo dibujo que `app/favicon.ico` (y que el 🪴 de los emails), pasado
 * a vectores: el favicon es un PNG de 96 px y, estirado a los 512 que pide la
 * PWA, se ve borroso. Las coordenadas son las del favicon (lienzo de 96), así
 * que se pueden comparar uno contra otro pixel a pixel.
 *
 * Lo rasteriza `scripts/generate-pwa-icons.ts`. Si cambia la marca, se cambia
 * acá y se vuelve a correr `bun run icons`.
 */

const OUTLINE = "#40396e"
const LEAF_LIGHT = "#96c362"
const LEAF_DARK = "#739f4d"
const POT = "#d47f56"
const POT_SHADOW = "#b7715b"
const STICKER = "#f2f2f2"

const LEFT_LEAF =
  "M13,17 C21,13 32,12 37,14 C42,16 44,22 43,28 C42,33 39,39 36,43 C28,40 21,35 17,29 C14,25 13,20 13,17 Z"
const RIGHT_LEAF =
  "M81,25 C74,19 66,15 59,16 C54,17 52,21 52,26 C52,32 55,39 58,43 C65,41 72,37 76,33 C79,30 81,27 81,25 Z"
const STEM = "M48,49 L48,41 C48,37 46,33 42,30 M48,41 C48,37 50,33 54,30"
const RIM = "M24,48 L72,48 L72,57 L24,57 Z"
const BODY = "M27,57 L69,57 L63,82 L33,82 Z"

/** Lo que va adentro del `<svg>`, sin el borde blanco. */
function plant(stroke: number) {
  return `
    <clipPath id="l"><path d="${LEFT_LEAF}"/></clipPath>
    <clipPath id="r"><path d="${RIGHT_LEAF}"/></clipPath>
    <path d="${LEFT_LEAF}" fill="${LEAF_DARK}"/>
    <path d="M10,15 L46,10 L46,31 Z" fill="${LEAF_LIGHT}" clip-path="url(#l)"/>
    <path d="${RIGHT_LEAF}" fill="${LEAF_DARK}"/>
    <path d="M50,12 L84,12 L84,26 L50,30 Z" fill="${LEAF_LIGHT}" clip-path="url(#r)"/>
    <g fill="none" stroke="${OUTLINE}" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round">
      <path d="${LEFT_LEAF}"/>
      <path d="${RIGHT_LEAF}"/>
      <path d="${STEM}"/>
    </g>
    <path d="${BODY}" fill="${POT}"/>
    <path d="M27,57 L69,57 L68.3,60 L27.7,60 Z" fill="${POT_SHADOW}"/>
    <path d="${RIM}" fill="${POT}"/>
    <g fill="none" stroke="${OUTLINE}" stroke-width="${stroke}" stroke-linejoin="round">
      <path d="${BODY}"/>
      <path d="${RIM}"/>
    </g>`
}

/**
 * El SVG de la maceta en un lienzo cuadrado de 96.
 *
 * `sticker` le suma el borde blanco del favicon. Va en los íconos que se ven
 * sobre el fondo del launcher; en los que llevan fondo propio (maskable, iOS)
 * sobra.
 */
export function plantMarkSvg({ sticker = false }: { sticker?: boolean } = {}) {
  const outline = sticker
    ? `<g fill="${STICKER}" stroke="${STICKER}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round">
        <path d="${LEFT_LEAF}"/><path d="${RIGHT_LEAF}"/><path d="${RIM}"/><path d="${BODY}"/>
        <path d="M42,30 L54,30 L52,48 L44,48 Z"/>
      </g>`
    : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">${outline}${plant(2.6)}</svg>`
}
