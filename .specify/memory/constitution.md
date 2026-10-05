<!-- 
SYNC IMPACT REPORT
------------------
Version change: 1.0.0 (initial ratification) → 1.1.0 (alignment with PRD Fase 1)
Added/Enhanced sections:
  - Principio II: métricas Lighthouse ≥90, límite de imágenes, accesibilidad prescriptiva (contraste ≥4.5:1, teclado)
  - Principio VII: "Código organizado" como requisito explícito de mantenibilidad
  - Definición de terminado: énfasis en prueba en celular real (no solo escritorio), código legible
Modified principles: II (Móvil Primero → Móvil Primero, Rendimiento y Accesibilidad), VII (Decisiones y Documentación → Decisiones, Documentación y Mantenibilidad)
Removed sections: None
Template placeholders: None
TODO items: None
-->

# Catálogo y Gestión de Repostería Casera — Constitución

## Principios Fundamentales

### I. Costo Cero para el Negocio
El negocio no pagará costos recurrentes de infraestructura o servicios.
**MUST** usar únicamente capas gratuitas de servicios que permitan uso comercial. **MUST** verificar términos de servicio y límites de cada proveedor antes de adoptarlo. El dominio propio es opcional y sería el único gasto posible.

_Verificación_: Antes de agregar cualquier servicio externo, documentar su modelo de precios y confirmar que la capa gratuita permite uso comercial en el ADR correspondiente.

### II. Móvil Primero, Rendimiento y Accesibilidad
La aplicación (catálogo público y panel de administración) se diseña prioritariamente para celular. El panel debe usarse cómodamente desde un dispositivo móvil, y el catálogo debe ser completamente funcional en pantallas pequeñas.
**MUST** validar toda pantalla en un dispositivo móvil real. **MUST** lograr puntuación ≥90 en Lighthouse (móvil). **MUST** limitar imágenes a referencia de cientos de KB. **SHOULD** limitar el flujo de publicación a pocos pasos (carga de foto, categorización, descripción básica). **MUST** incluir accesibilidad: contraste ≥4.5:1, texto alternativo en imágenes, navegación con teclado en panel.

_Verificación_: Cada cambio se prueba en celular real antes de pasar a revisión. Auditar Lighthouse antes de PR. Revisar contraste y a11y con herramientas estándar. La definición de terminado incluye prueba en dispositivo real.

### III. Privacidad y Seguridad por Defecto
Las fotos publicadas no expondrán metadatos sensibles, especialmente ubicación GPS. El panel exige autenticación de la administradora.
**MUST** eliminar metadatos (EXIF, GPS) de toda foto subida. **MUST** proteger el panel con autenticación. **MUST** validar tipo y tamaño de todo archivo subido. **MUST** no almacenar secretos en el repositorio.

_Verificación_: Revisar metadatos de fotos procesadas con herramientas estándar. Verificar que panel redirige sin autenticación. Revisar en cada PR que no hay secretos en código.

### IV. Alcance Disciplinado
Solo se implementan las funcionalidades definidas en el PRD de la Fase 1. Inventario, finanzas y recetas quedan fuera hasta que una evaluación explícita las apruebe.
**MUST** rechazar cambios que amplíen el alcance sin aprobación previa. **SHOULD** documentar en el ADR cualquier decisión de posponer funcionalidad.

_Verificación_: En cada PR, validar que los cambios caen dentro del alcance de Fase 1 documentado. Usar el ADR como referencia.

### V. Calidad Verificable
La lógica de negocio y los flujos críticos de cada historia tienen pruebas automatizadas basadas en los criterios de aceptación del PRD.
**MUST** escribir pruebas para lógica de negocio (ej. procesamiento de fotos, autenticación) y flujos críticos de usuario. **SHOULD** usar los criterios de aceptación del PRD como base para diseñar pruebas. No se exige un porcentaje de cobertura mínimo.

_Verificación_: Revisar que toda lógica de negocio nueva tiene pruebas. Validar que criterios de aceptación tienen tests asociados.

### VI. Entrega Continua
CI corre en cada cambio. La rama `main` siempre está en estado estable y desplegable. Todo cambio entra por Pull Request.
**MUST** ejecutar CI en cada PR. **MUST** que CI esté en verde antes de fusionar. **MUST** usar Pull Request para todo cambio en `main`.

_Verificación_: Revisar que el repositorio tiene CI configurado. Validar que `main` solo acepta cambios por PR con CI pasando.

### VII. Decisiones, Documentación y Mantenibilidad
Toda decisión técnica relevante (stack, base de datos, almacenamiento, hosting, autenticación, formatos de imagen) queda registrada en ADRs. El README se mantiene al día. El código se organiza en una estructura clara y legible.
**MUST** crear un ADR para decisiones técnicas significativas. **MUST** mantener el README actualizado tras cambios. **MUST** organizar el código en módulos/componentes claros con nombres descriptivos. **SHOULD** referenciar el ADR correspondiente en la descripción del PR.

_Verificación_: Revisar que existen ADRs para decisiones iniciales (stack, BD, almacenamiento, hosting, autenticación). Validar que README describe la estructura del proyecto y cómo ejecutarlo. En cada PR, evaluar legibilidad y organización del código nuevo.

## Flujo de Trabajo

**Rama principal**: `main` siempre está en estado desplegable. Solo recibe cambios por Pull Request.

**Ramas de cambio**: Cada cambio va en una rama corta con prefijo `feature/`, `fix/`, `docs/` o `chore/`. Se fusiona con squash a `main`.

**Versionado**: Versiones semánticas con etiquetas `vX.Y.Z` en `main`.

**Commits**: Conventional Commits en inglés, con ámbito y referencia a la historia (formato: `<type>(<scope>): <subject>` / `Refs: HU-NN`).

**Definición de terminado**: 
- Criterios de aceptación del PRD cumplidos.
- **Probado en un celular real** (no solo navegador de escritorio).
- CI en verde.
- Documentación actualizada (README, ADR si aplica).
- Código organizado y legible.

**Idioma**:
- Especificaciones, documentación, comentarios del código e interfaz: **español**.
- Identificadores de código, ramas, commits: **inglés**.

## Governance

Esta constitución se rige por versionado semántico e invoca cambios MAJOR/MINOR/PATCH según criterios estándar:

- **MAJOR**: Cambios incompatibles en principios (eliminación o redefinición fundamental).
- **MINOR**: Adición de nuevo principio o expansión material de una sección.
- **PATCH**: Aclaraciones, correcciones de redacción, refinamientos sin cambiar el sentido.

Las enmiendas requieren justificación escrita (en el ADR correspondiente o en la PR del cambio constitucional). La constitución es la autoridad suprema en gobernanza; otras prácticas se alinean a ella.

**Versión**: 1.1.0 | **Ratificada**: 2026-10-02 | **Última enmienda**: 2026-10-05
