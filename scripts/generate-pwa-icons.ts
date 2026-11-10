/**
 * Íconos de la PWA, generados desde la maceta de `lib/plant-mark.ts`.
 *
 * Los PNG se commitean: el build de Vercel no tiene por qué depender de sharp,
 * que es una dependencia nativa. Correr a mano cuando cambie la marca:
 *
 *   bun run icons
 *
 * El rango de `sharp` en package.json sigue al que Next declara como
 * `optionalDependency` (hoy `^0.35.5`). En versiones `0.x` el caret fija la
 * minor: si no coinciden, bun instala dos copias con sus binarios de libvips.
 * Si subís Next, mirá si hay que mover esta también.
 */

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

import { plantMarkSvg } from "../lib/plant-mark"

const ROOT = path.resolve(import.meta.dir, "..")
const PUBLIC_ICONS = path.join(ROOT, "public", "icons")
const APP_DIR = path.join(ROOT, "app")

/*
 * El `--background` del tema claro de `globals.css` (`120 39% 95%`), que es el
 * `defaultTheme`. El ícono del launcher no sigue al tema del sistema: hay que
 * elegir uno.
 */
const BACKGROUND = "#edf7ed"

/** La maceta escalada a un lienzo de `size`, sin fondo. */
function markPng(size: number, sticker: boolean) {
  return sharp(Buffer.from(plantMarkSvg({ sticker })), { density: 72 * (size / 96) * 2 })
    .resize(size, size)
    .png()
}

/**
 * La maceta centrada sobre fondo sólido.
 *
 * `coverage` es cuánto del lado ocupa el lienzo de 96 de la marca (el dibujo en
 * sí ocupa ~70% de ese lienzo). Android recorta el `maskable` a la forma del
 * launcher y sólo garantiza el círculo central del 80%.
 */
async function paddedPng(size: number, coverage: number) {
  const mark = Math.round(size * coverage)
  const offset = Math.round((size - mark) / 2)

  return sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: await markPng(mark, false).toBuffer(), top: offset, left: offset }])
    .png()
}

async function main() {
  await mkdir(PUBLIC_ICONS, { recursive: true })

  const outputs: Array<[string, Buffer]> = [
    // Los dos que Chrome exige para considerar la app instalable. Con el borde
    // blanco del favicon, porque se ven sobre el fondo del launcher.
    [path.join(PUBLIC_ICONS, "icon-192.png"), await markPng(192, true).toBuffer()],
    [path.join(PUBLIC_ICONS, "icon-512.png"), await markPng(512, true).toBuffer()],
    [path.join(PUBLIC_ICONS, "icon-maskable-512.png"), await (await paddedPng(512, 0.8)).toBuffer()],
    /*
     * iOS no compone sobre transparencia: la aplana contra negro. Y redondea
     * las esquinas él solo, así que va cuadrado y con fondo. Next lo linkea
     * solo como `apple-touch-icon` por estar en `app/`.
     */
    [path.join(APP_DIR, "apple-icon.png"), await (await paddedPng(180, 0.95)).toBuffer()],
  ]

  for (const [file, data] of outputs) {
    await writeFile(file, data)
    console.log(`${path.relative(ROOT, file)}  ${(data.length / 1024).toFixed(1)} kB`)
  }
}

await main()
