# ADR 0001: Estrategia de ramas
Estado: aceptada
Revisión: 2026-10-08. El repositorio pasó a público para poder proteger `main` sin costo (ruleset `protect-main`, sin excepciones para la administradora). Ver `specs/001-project-skeleton/research.md` D14.

Contexto: app web con una sola versión en producción, desarrollada por
una persona, con `main` protegida por un ruleset de GitHub (repositorio público, plan gratuito).

Decisión: GitHub Flow. main siempre desplegable; ramas cortas con
prefijo; PR con squash; tags semánticos; Conventional Commits.

Alternativas: GitFlow, descartada porque agrega develop y ramas de
release pensadas para varias versiones en paralelo y equipos grandes.

Consecuencias: flujo simple y fácil de cumplir; sin staging dedicado.
Se reevalúa si hay varias versiones vivas o más colaboradores.

Protección de `main` (ruleset `protect-main`): solo fusión por pull request con squash, sin borrado ni push forzado, sin bypass. Pendiente: agregar como obligatorio el check de CI cuando exista el flujo `ci.yml` (funcionalidad 001).
