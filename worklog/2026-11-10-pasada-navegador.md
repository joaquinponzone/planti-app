# Pasada por el navegador y formularios que no pierden lo escrito

2026-11-10 · rama `feat/cuentas-db`

Decisión: [D-012](decisiones.md#d-012--formularios-con-useformaction-no-useactionstate-directo)

## Por qué

El roadmap pedía probar con clics, antes de mergear a `main`, lo que nunca se había
probado así. `demo.planti.casa` tiene Deployment Protection de Vercel, así que la pasada
se hizo en local.

## Cómo se probó

`bun dev` contra una base SQLite nueva fuera del repo (`TURSO_DATABASE_URL=file:…`), sin
`RESEND_API_KEY` (los links salen por consola), manejado con `agent-browser`. Dos cuentas
de prueba.

Funcionó: registro y confirmación del email, agregar plantas, regar desde la tarjeta,
cuidado rápido (Pulverización), diálogo con notas (Tratamiento), borrar del historial
(persiste al recargar), umbrales (una planta regada hace 5 días con umbral 3/7 se pone
amarilla con badge), editar planta (cambia de grupo), borrar planta (el historial cae en
cascada), salir, login con contraseña mala y buena (vuelve a `from`; `from=//evil.com`
termina en `/`), exportar, y vista de celular en modo oscuro. La segunda cuenta ve "No
encontramos esa página" en el detalle y en editar una planta de la primera.

## Qué se arregló

- **Los formularios perdían lo escrito al dar error.** React 19 resetea el `<form>` al
  terminar la acción, con error incluido. Con umbrales 10/5 aparecía "Peligro tiene que
  tener más días que Aviso" y los campos volvían a 14/30; al editar una planta con nombre
  vacío se perdían ubicación y notas; el login borraba el email. Nuevo
  `lib/use-form-action.ts`: recuerda lo enviado (sin contraseñas) y los campos lo usan de
  `defaultValue`. Lo usan login, registro, recuperar contraseña, el formulario de planta
  y los umbrales.
- **Umbrales:** el formulario pasó a un componente que se monta sólo con el popover
  abierto (`ThresholdsForm`). Antes, el estado vivía afuera: un error quedaba visible al
  cancelar y volver a abrir.
- `components/ui/dialog.tsx`: el botón de cerrar decía "Close" para lectores de pantalla;
  ahora "Cerrar".

## Cómo se verificó el arreglo

En el navegador: login con contraseña mala conserva el email y vacía la contraseña, y la
buena redirige. Umbrales 10/5 dan error y quedan 10/5; cancelar y reabrir muestra lo
guardado sin error; 4/9 se guarda, cierra el popover y sigue al recargar. Editar con
nombre vacío conserva ubicación y notas; con nombre válido guarda y redirige al detalle.
Crear planta redirige al inicio. `bun run lint`, `bun run typecheck`, `bun run test` (37
pass) y `bun run build`.

## No se probó

- Importar un backup y recuperar contraseña, ni antes ni después del arreglo.
- Nada en el deploy: ni Turso ni Resend reales, ni la PWA instalada en un celular.
- No hay test automático del reset: haría falta un test de componentes en un navegador,
  que el proyecto no tiene.
