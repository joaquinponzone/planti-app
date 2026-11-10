<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Worklog: leer antes de empezar, actualizar al terminar

`worklog/` guarda lo que el código no dice. Ver [`worklog/README.md`](worklog/README.md).

- **Antes de empezar:** leer `worklog/roadmap.md` (qué sigue y qué preguntas siguen abiertas)
  y `worklog/decisiones.md` (qué ya se decidió y por qué; no reabrir sin un motivo nuevo).
- **Al terminar un trabajo:** escribir `worklog/AAAA-MM-DD-tema.md` (qué se hizo, por qué,
  cómo se verificó y qué no se probó), sumar las decisiones nuevas a `decisiones.md` y
  actualizar el estado en `roadmap.md`.
