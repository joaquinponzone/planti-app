# UI en español

2026-11-10 · rama `feat/cuentas-db`

Decisión: [D-009](decisiones.md#d-009--ui-solo-en-español-sin-framework-de-i18n)

## Por qué

La app estaba entera en inglés (y el auth nuevo también, para no desentonar), pero sus
usuarias hablan español. Se hizo antes de salir a producción: la primera vez que la usuaria
vea la versión nueva (login, cuenta, email de confirmación) ya es un cambio grande, y que
encima le llegue en inglés empeora la primera impresión.

## Qué se hizo

**Diccionario y regla**
- `CARE_ACTIVITY_LABELS` en `lib/care.ts` (`Record<CareActivityType, string>`). Son
  sustantivos ("Riego", "Trasplante") porque sirven igual en el botón y en el historial.
  Reemplaza las etiquetas que estaban repetidas en el detalle de la planta y en el diálogo de
  notas.
- La regla quedó escrita en `AGENTS.md` ("El dominio habla inglés, la pantalla habla
  español"), como en futclub.

**Mensajes**
- `lib/zod.ts`: `z` con `z.locales.es()`. Todos los schemas lo importan de ahí (ver el
  porqué en el archivo: `sideEffects: false`). Los schemas de Planti tienen mensajes propios;
  esto es el piso.
- Mensajes de validación, de las Server Actions y de auth, en español.
- Los tres emails (confirmar, recuperar y "ya tenés cuenta"), con `lang="es"`.

**Pantallas**
- Todas las páginas y componentes; `<html lang="es">`, título y descripción.
- `lib/dates.ts` en `es-AR`: "hoy", "ayer", "anteayer", "hace 3 días".
- `app/not-found.tsx`: la 404 de Next estaba en inglés, y es lo que ve quien abre una planta
  inexistente o ajena.
- Grupo sin ubicación: "Unassigned" → "Sin ubicación". Popover de umbrales: "Alertas de
  riego", con "Aviso" y "Peligro".

## Cómo se verificó

- Lint, typecheck, build y los 25 tests en verde (se actualizaron las expectativas de
  `formatDaysAgo`).
- Se recorrieron las pantallas con la app levantada, extrayendo el texto visible: login,
  errores de login y de registro, "revisá tu email", home vacía y con planta, detalle,
  validación de nombre vacío y 404. Todo en español, sin errores en el log.
- **No verificado:** cómo se ve el email en un cliente de correo real (depende de Resend).
