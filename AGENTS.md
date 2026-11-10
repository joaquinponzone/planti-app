<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## El dominio habla inglés, la pantalla habla español

La UI está en español rioplatense, con voseo ("Confirmá", "Entrá"). Un solo idioma, sin
framework de i18n (ver D-009 en `worklog/decisiones.md`).

- **Todo valor que se guarda va en inglés**: columnas, enums, claves (`watered`,
  `fertilization`). Si una palabra española llega al esquema, es un bug.
- **La traducción de los valores del dominio pasa una sola vez**, por el mapa que está al
  lado de su enum: `CARE_ACTIVITY_LABELS` en `lib/care.ts`. Es `Record<Tipo, string>`, así
  que agregar un tipo sin etiqueta no compila. Si estás por escribir un mapa de etiquetas
  dentro de un componente, ya existe o tiene que nacer en `lib/care.ts`.
- **La prosa no va al diccionario**: botones, títulos y mensajes se escriben en español
  directamente en el componente.
- **Los schemas importan `z` desde `@/lib/zod`, nunca desde "zod".** Ahí se configuran los
  mensajes por defecto en español; zod declara `sideEffects: false` y un `z.config` suelto
  puede no aplicarse.
- Fechas con `lib/dates.ts` (`es-AR`, zona horaria del usuario). Lenguaje neutro cuando
  hay género: "Te damos la bienvenida", no "Bienvenida/o".

## Verificar antes de dar algo por terminado

`bun run lint`, `bunx tsc --noEmit -p .` y `bun run test`. Los tests usan una base SQLite
temporal (`tests/setup.ts`), nunca la de `.env`, y no mandan emails.

## Worklog: leer antes de empezar, actualizar al terminar

`worklog/` guarda lo que el código no dice. Ver [`worklog/README.md`](worklog/README.md).

- **Antes de empezar:** leer `worklog/roadmap.md` (qué sigue y qué preguntas siguen abiertas)
  y `worklog/decisiones.md` (qué ya se decidió y por qué; no reabrir sin un motivo nuevo).
- **Al terminar un trabajo:** escribir `worklog/AAAA-MM-DD-tema.md` (qué se hizo, por qué,
  cómo se verificó y qué no se probó), sumar las decisiones nuevas a `decisiones.md` y
  actualizar el estado en `roadmap.md`.
