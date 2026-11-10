# Worklog de Planti

Lo que el código no dice: por qué existe cada cosa, contra qué alternativa se eligió, qué se
dejó afuera a propósito y qué viene después. El código se lee solo; esto no.

## Los tres documentos

| Archivo | Responde | Cuándo se escribe |
|---|---|---|
| [`roadmap.md`](roadmap.md) | qué falta, en qué orden, y qué preguntas siguen abiertas | se actualiza al cerrar cada paso |
| [`decisiones.md`](decisiones.md) | qué se decidió, contra qué alternativa y por qué | al cerrar una decisión; se agrega, no se reescribe |
| `AAAA-MM-DD-tema.md` | qué se hizo, por qué y cómo se verificó | al terminar un trabajo, una entrada por trabajo |

## Una entrada del worklog

Nombre: `AAAA-MM-DD-tema-en-kebab.md`, con la fecha del día en que se terminó. Secciones:

```markdown
# Tema

Fecha · rama `nombre` · commit `abc1234`

## Por qué
El problema o la necesidad. Una o dos líneas alcanzan.

## Qué se hizo
Los cambios agrupados por área, con las rutas de los archivos que importan.

## Cómo se verificó
Qué se probó y con qué resultado. Lo que NO se probó también va acá, dicho de frente.

## Pendiente
Lo que quedó afuera, con el motivo.
```

Sin relleno: si una sección no tiene nada, se borra.

## Una decisión

En `decisiones.md`, la más nueva arriba. Si una decisión se revierte, no se borra: se agrega
la nueva y se marca la vieja como **reemplazada por** la otra. La historia de por qué se
cambió de idea vale tanto como la idea.
