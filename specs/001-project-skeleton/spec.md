# Feature Specification: Esqueleto desplegado de punta a punta

**Feature Branch**: `feature/001-project-skeleton`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Funcionalidad 001: esqueleto desplegado de punta a punta (Hito 1 del PRD, HU-14). Primera entrega: sin funciones de negocio, demuestra que un cambio pasa del repositorio a internet de forma validada y automática, y que el sitio público ya muestra la identidad del negocio."

**Referencias**: `docs/contexto-y-objetivos.md`, `docs/prd-fase-1.md` (sección 7 Hito 1; HU-13, HU-14), `.specify/memory/constitution.md`, `docs/design/mockups.md`.

## Clarifications

### Session 2026-10-08

- Q: ¿Dónde y de qué forma debe quedar registrado el resultado de la prueba en un celular real? → A: Casilla en la descripción del pull request, con modelo de celular, navegador y fecha
- Q: ¿Las reglas de la rama principal deben aplicar también a la persona administradora del repositorio? → A: Sí, aplican también a la administradora, sin excepciones
- Q: ¿Cada propuesta de cambio debe tener una versión de vista previa publicada? → A: No, solo se publica al fusionar en la rama principal
- Q: ¿Qué navegadores deben funcionar correctamente con la página de inicio? → A: Cualquier navegador, incluidos los antiguos
- Q: ¿Qué debe ver el visitante en una dirección que no existe en el sitio? → A: Página simple con logo, mensaje amable y enlace para volver al inicio

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la página de inicio con la identidad del negocio (Priority: P1)

Un visitante abre el enlace público desde su celular y ve una página de inicio con el logo, el nombre "Samuelé Repostería", el lema "Creamos momentos dulces" y un mensaje que indica que el catálogo estará disponible pronto. La página respeta la identidad visual aprobada en los mockups (colores, tipografía, móvil primero) y también se ve bien en tableta y escritorio.

**Why this priority**: Es lo único que un visitante puede ver y es la prueba de que el sitio ya está en internet con la identidad del negocio. Sin ella, el esqueleto no demuestra nada visible.

**Independent Test**: Abrir el enlace público en un celular real y verificar que se muestran logo, nombre, lema y mensaje, sin desplazamiento horizontal; repetir en tableta y escritorio.

**Acceptance Scenarios**:

1. **Given** el sitio publicado, **When** un visitante abre el enlace desde un celular, **Then** ve el logo, el nombre "Samuelé Repostería", el lema "Creamos momentos dulces" y un mensaje de que el catálogo estará disponible pronto.
2. **Given** la página abierta en una pantalla de celular, **When** el visitante recorre la página, **Then** no existe desplazamiento horizontal y el texto del cuerpo es legible (16 px o más).
3. **Given** la página abierta en tableta o escritorio, **When** se carga, **Then** el contenido se ve ordenado, centrado y con la misma identidad visual, sin elementos cortados ni estirados.
4. **Given** la página cargada, **When** un usuario de lector de pantalla la recorre, **Then** el logo tiene texto alternativo descriptivo.
5. **Given** la tipografía script de títulos no disponible, **When** se carga la página, **Then** se muestra una tipografía de respaldo legible sin romper el diseño.

---

### User Story 2 - Validación automática de cada propuesta de cambio (Priority: P2)

Un desarrollador abre una propuesta de cambio (pull request) y esta se valida automáticamente con verificación de tipos, revisión de estilo y pruebas automatizadas. Si la validación falla, la propuesta no puede fusionarse.

**Why this priority**: Garantiza que la rama principal siempre sea estable (Principio VI de la constitución) y protege todas las historias posteriores.

**Independent Test**: Abrir una propuesta con un cambio correcto (validación en verde, fusionable) y otra con un error de tipos, de estilo o una prueba rota (validación en rojo, fusión bloqueada).

**Acceptance Scenarios**:

1. **Given** una propuesta de cambio abierta, **When** se crea o se actualiza, **Then** la validación se ejecuta sola y reporta resultado de tipos, estilo y pruebas.
2. **Given** una propuesta cuya validación falla en cualquiera de las tres comprobaciones, **When** el desarrollador intenta fusionarla, **Then** la fusión está bloqueada.
3. **Given** una propuesta con validación en verde, **When** se revisa, **Then** puede fusionarse.
4. **Given** un intento de cambio directo a la rama principal sin propuesta, **When** se intenta, **Then** es rechazado.

---

### User Story 3 - Publicación automática al fusionar (Priority: P2)

Cuando un cambio se fusiona en la rama principal, el sitio público se actualiza solo, sin pasos manuales. Si la publicación falla, el sitio anterior sigue funcionando y el fallo queda visible.

**Why this priority**: Completa el recorrido de punta a punta repositorio → internet, objetivo central del hito.

**Independent Test**: Fusionar un cambio visible (por ejemplo, ajustar el mensaje) y comprobar que aparece en el sitio público sin intervención; forzar una publicación fallida y comprobar que el sitio anterior sigue respondiendo y que el fallo es visible.

**Acceptance Scenarios**:

1. **Given** un cambio fusionado en la rama principal, **When** termina la publicación, **Then** el sitio público refleja el cambio sin pasos manuales.
2. **Given** una publicación que falla, **When** un visitante abre el sitio, **Then** ve la versión anterior funcionando.
3. **Given** una publicación que falla, **When** el desarrollador revisa el repositorio, **Then** el fallo es visible como un estado fallido, con su registro de ejecución. No se requiere notificación activa; basta con el estado fallido y el registro visibles en el repositorio.

---

### User Story 4 - Documentación para un desarrollador nuevo (Priority: P3)

Un desarrollador nuevo, con solo el README, puede levantar el proyecto en local, ejecutar las pruebas y entender cómo se publica.

**Why this priority**: Es requisito de mantenibilidad (Principio VII) y de la definición de terminado, pero no bloquea la demostración técnica.

**Independent Test**: Una persona que no conoce el proyecto sigue únicamente el README en una máquina limpia y logra ver la página en local, correr las pruebas y explicar el flujo de publicación.

**Acceptance Scenarios**:

1. **Given** una máquina con los requisitos indicados en el README, **When** se siguen sus pasos, **Then** el proyecto corre en local y muestra la página de inicio.
2. **Given** el proyecto en local, **When** se siguen las instrucciones de pruebas, **Then** las pruebas, la verificación de tipos y la revisión de estilo se ejecutan y pasan.
3. **Given** el README, **When** se lee la sección de publicación, **Then** explica cómo se valida una propuesta, cómo se publica al fusionar y qué hacer si falla.

---

### Edge Cases

- Conexión celular lenta: la página debe mostrar su contenido principal rápido, sin depender de recursos pesados.
- Logo no carga: se debe mostrar el texto alternativo y el nombre del negocio sigue visible.
- Pantallas muy angostas (≈320 px) y muy anchas: sin desplazamiento horizontal ni contenido desbordado.
- Ruta inexistente en el sitio: el visitante ve una página simple con el logo, un mensaje amable y un enlace para volver al inicio, no una pantalla en blanco ni un error técnico. El diseño detallado de errores es HU-15, fuera de este hito.
- Dos fusiones seguidas en la rama principal: la publicación final debe corresponder al cambio más reciente.
- Falla de la validación por un problema externo (no del código): el desarrollador puede reintentarla sin crear un cambio nuevo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sitio MUST ofrecer una página de inicio pública con el logo, el nombre "Samuelé Repostería", el lema "Creamos momentos dulces" y un mensaje que indique que el catálogo estará disponible pronto.
- **FR-002**: La página MUST aplicar la identidad visual de `docs/design/mockups.md`: paleta de colores, tipografía script para títulos con respaldo, tipografía de sistema para el resto y texto del cuerpo de al menos 16 px.
- **FR-003**: La página MUST diseñarse móvil primero y adaptarse a tableta y escritorio sin desplazamiento horizontal en ningún ancho.
- **FR-003a**: La página MUST funcionar en cualquier navegador, incluidos los antiguos: el contenido esencial (logo, nombre, lema y mensaje) MUST ser legible aunque el navegador no soporte funciones modernas de estilo (mejora progresiva). La verificación obligatoria se limita al celular real de SC-004 y a las pruebas automatizadas; no se mantiene una matriz de navegadores.
- **FR-004**: Todo texto MUST tener contraste mínimo de 4.5:1 respecto a su fondo.
- **FR-005**: El logo MUST tener texto alternativo.
- **FR-006**: Cada propuesta de cambio MUST ejecutar automáticamente verificación de tipos, revisión de estilo y pruebas automatizadas.
- **FR-007**: La rama principal MUST rechazar fusiones de propuestas cuya validación no esté en verde y cambios directos sin propuesta. Estas reglas MUST aplicar también a la persona administradora del repositorio, sin excepciones (si hay una emergencia, la protección se relaja temporalmente de forma deliberada).
- **FR-008**: Al fusionar en la rama principal, el sitio público MUST actualizarse automáticamente sin pasos manuales.
- **FR-009**: Si una publicación falla, el sitio anterior MUST seguir disponible y el fallo MUST quedar visible para el desarrollador.
- **FR-010**: Debe existir al menos una prueba automatizada que verifique el contenido esencial de la página de inicio (nombre, lema, mensaje y texto alternativo del logo), de modo que la validación tenga algo real que comprobar.
- **FR-011**: El README MUST explicar requisitos previos, cómo levantar el proyecto en local, cómo ejecutar pruebas, tipos y estilo, y cómo funcionan la validación y la publicación.
- **FR-012**: La funcionalidad MUST operar sin costo recurrente; los servicios usados MUST estar en capas gratuitas que permitan uso comercial y quedar documentados en los registros de decisiones.
- **FR-013**: Ningún secreto MUST almacenarse en el repositorio.
- **FR-008a**: La publicación MUST ocurrir solo al fusionar en la rama principal; no se publican vistas previas por propuesta de cambio. La prueba en celular real previa a la fusión se hace contra el servidor local.
- **FR-014**: La funcionalidad MUST excluir catálogo, categorías, detalle de trabajos, WhatsApp, inicio de sesión, panel, base de datos y fotos de trabajos.
- **FR-015**: El sitio MUST ser accesible desde internet en la dirección gratuita que asigne el proveedor. El dominio propio queda para un hito posterior y no forma parte de esta funcionalidad.

### Key Entities

No se manejan datos de negocio en esta funcionalidad.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La página de inicio obtiene puntuación ≥90 en rendimiento y ≥90 en accesibilidad en una auditoría móvil estándar. La auditoría se ejecuta automáticamente en cada propuesta de cambio y su resultado es solo informativo: no bloquea la fusión.
- **SC-002**: El 100 % del texto visible cumple contraste ≥4.5:1 y el logo tiene texto alternativo, verificado con herramienta estándar.
- **SC-003**: En anchos desde 320 px, no hay desplazamiento horizontal en ninguna pantalla de la funcionalidad.
- **SC-004**: La página se probó en al menos un celular real y el resultado quedó registrado en la descripción del pull request, con una casilla marcada que indica modelo de celular, navegador y fecha (definición de terminado de la constitución).
- **SC-005**: Un cambio fusionado aparece en el sitio público sin intervención manual en un máximo de 10 minutos.
- **SC-006**: El 100 % de las propuestas con validación fallida queda bloqueado para fusión.
- **SC-007**: Una publicación fallida deja el sitio anterior disponible el 100 % del tiempo.
- **SC-008**: Un desarrollador nuevo logra levantar el proyecto, correr las pruebas y explicar la publicación solo con el README, en menos de 30 minutos.
- **SC-009**: El costo recurrente de la funcionalidad es $0.

## Assumptions

- El logo y la paleta son los definidos en `docs/design/SamuelE.jpg` y `docs/design/mockups.md`; se usa el logo recortado en círculo como en los mockups.
- El stack, hosting y fuentes son los de los ADR 0002–0007; esta especificación no los reabre.
- El mensaje de "catálogo pronto" tiene redacción libre, p. ej. "Nuestro catálogo estará disponible muy pronto".
- No hay botón de contacto, WhatsApp ni datos de contacto en esta página (fuera de alcance).
- El repositorio está alojado en una plataforma que permite proteger la rama principal y ejecutar validaciones automáticas gratis.
- Los umbrales de rendimiento (≥90) y el tiempo de publicación (10 min) son metas razonables propuestas, ajustables.
- Una sola persona desarrolladora mantiene el proyecto; no se requieren aprobaciones de varios revisores.
