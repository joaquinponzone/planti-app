/**
 * zod con los mensajes por defecto en español.
 *
 * Todos los schemas importan `z` desde acá y no desde "zod". No es por
 * prolijidad: zod declara `"sideEffects": false`, así que un `z.config()` en
 * un módulo que nadie importa explícitamente puede quedar afuera del bundle, y
 * los mensajes siguen saliendo en inglés sin que nada avise (pasó en futclub).
 * Importando `z` de acá, la configuración corre sí o sí antes del primer schema.
 *
 * Es el piso: cada schema de Planti tiene sus propios mensajes. Esto cubre el
 * validador que alguien agregue sin mensaje.
 */
import { z } from "zod"

z.config(z.locales.es())

export { z }
