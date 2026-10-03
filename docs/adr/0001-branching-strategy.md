# ADR 0001: Estrategia de ramas
Estado: aceptada

Contexto: app web con una sola versión en producción, desarrollada por
una persona, sin protección de ramas (repositorio privado, plan gratuito).

Decisión: GitHub Flow. main siempre desplegable; ramas cortas con
prefijo; PR con squash; tags semánticos; Conventional Commits.

Alternativas: GitFlow, descartada porque agrega develop y ramas de
release pensadas para varias versiones en paralelo y equipos grandes.

Consecuencias: flujo simple y fácil de cumplir; sin staging dedicado.
Se reevalúa si hay varias versiones vivas o más colaboradores.