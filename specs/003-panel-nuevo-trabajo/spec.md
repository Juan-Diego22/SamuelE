# Feature Specification: Panel de trabajos y creación de trabajos

**Feature Branch**: `feature/003-panel-nuevo-trabajo`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Lee docs/design/mockups.md. En estos momentos tenemos ya creado el login del administrador, que nos redirige al 'panel de trabajos'. Lee el mockups.html y vas a ver cómo está compuesto este panel para que la administradora pueda agregar los trabajos."

**Referencias**: `docs/prd-fase-1.md` (Hito 3; HU-07, HU-08), `.specify/memory/constitution.md` (principios I, II, III, V), `docs/adr/0004-almacenamiento-de-imagenes.md`, `docs/adr/0005-optimizacion-de-imagenes.md`, `docs/design/mockups.md` (pantallas 4 y 5), `docs/design/mockups.html` y `docs/design/5 · Panel lista + confirmar.png`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publicar un trabajo nuevo con foto y categoría (Priority: P1)

La administradora entra al panel desde su celular, pulsa "+ Nuevo trabajo", elige una foto (de la galería o tomándola con la cámara), selecciona una categoría, opcionalmente escribe un título y una descripción, y pulsa "Publicar". El trabajo queda guardado y la administradora vuelve a la lista, donde lo ve al inicio.

**Why this priority**: Es el objetivo central del Hito 3 y del producto: sin trabajos publicados no hay catálogo. Es el único flujo que aporta valor por sí solo.

**Independent Test**: En un celular real, iniciar sesión, pulsar "+ Nuevo trabajo", subir una foto, elegir categoría y publicar. Comprobar que el trabajo aparece en la lista del panel y que el proceso tomó menos de un minuto.

**Acceptance Scenarios**:

1. **Given** la pantalla "Nuevo trabajo", **When** la administradora elige una foto válida y una categoría y pulsa "Publicar", **Then** el trabajo se guarda y ella vuelve a la lista de trabajos viéndolo con su miniatura, título y categoría.
2. **Given** la pantalla "Nuevo trabajo", **When** publica solo con foto y categoría (sin título ni descripción), **Then** el trabajo se guarda correctamente.
3. **Given** la pantalla "Nuevo trabajo", **When** pulsa el campo de foto en un celular, **Then** puede elegir entre la galería y la cámara.
4. **Given** la pantalla "Nuevo trabajo", **When** pulsa "Publicar" sin foto o sin categoría, **Then** no se guarda nada y se muestra un mensaje claro que indica qué campo falta.
5. **Given** que ha elegido una foto, **When** la ve en el formulario antes de publicar, **Then** puede confirmar visualmente que es la correcta o cambiarla.

---

### User Story 2 - Foto optimizada automáticamente y sin datos sensibles (Priority: P1)

La administradora sube la foto tal como sale de su celular, sin preocuparse por el tamaño ni el formato. El sistema la acepta si es una imagen común, la corrige de orientación, la prepara en varios tamaños (miniatura, mediano y grande) en un formato eficiente para web y elimina sus metadatos, en especial la ubicación.

**Why this priority**: Es obligatoria (Must) y por privacidad (principio III): una foto con ubicación GPS publicada expondría el domicilio de la administradora. También condiciona la velocidad del futuro catálogo en celular.

**Independent Test**: Subir una foto tomada con celular que contenga ubicación GPS y orientación rotada; comprobar que las versiones publicadas se ven derechas, pesan mucho menos que el original y no contienen metadatos de ubicación.

**Acceptance Scenarios**:

1. **Given** una foto de celular con orientación rotada, **When** se publica el trabajo, **Then** las versiones generadas se ven derechas.
2. **Given** una foto con ubicación GPS en sus metadatos, **When** se publica, **Then** ninguna versión publicada contiene ubicación ni otros metadatos.
3. **Given** una foto válida, **When** se publica, **Then** existen versiones miniatura, mediana y grande, y ninguna supera el límite de peso definido para imágenes del catálogo.
4. **Given** un archivo que no es una imagen de un formato aceptado (por ejemplo un PDF), **When** intenta subirlo, **Then** se rechaza con un mensaje claro y el formulario conserva lo demás que ya escribió.
5. **Given** una imagen que supera el tamaño máximo permitido, **When** intenta subirla, **Then** se rechaza con un aviso comprensible que indica el límite.
6. **Given** un archivo con extensión de imagen pero cuyo contenido no es una imagen, **When** intenta subirlo, **Then** se rechaza igual que cualquier archivo no válido.

---

### User Story 3 - Ver la lista de "Mis trabajos" (Priority: P2)

Al entrar, la administradora ve el panel "Mis trabajos" con el logo pequeño, el botón "Salir", el botón "+ Nuevo trabajo" y una tarjeta por cada trabajo publicado (miniatura, título y categoría), con los más recientes primero. Si todavía no hay trabajos, ve un mensaje que la invita a crear el primero.

**Why this priority**: Es el punto de partida y de regreso del flujo de creación, y confirma que lo publicado quedó guardado. Sin embargo, la creación aporta valor aunque la lista fuera mínima, por eso es P2.

**Independent Test**: Iniciar sesión sin trabajos y ver el mensaje de lista vacía; publicar dos trabajos y comprobar que ambos aparecen, el más reciente primero.

**Acceptance Scenarios**:

1. **Given** que no hay trabajos, **When** la administradora entra al panel, **Then** ve un mensaje amable que la invita a crear el primero y el botón "+ Nuevo trabajo".
2. **Given** que hay trabajos publicados, **When** entra al panel, **Then** ve una tarjeta por trabajo con miniatura, título y categoría, el más reciente primero.
3. **Given** un trabajo sin título, **When** aparece en la lista, **Then** la tarjeta lo muestra de forma legible usando su categoría en lugar de un título vacío.
4. **Given** el panel, **When** pulsa "Salir", **Then** cierra sesión (comportamiento ya existente).
5. **Given** que no ha iniciado sesión, **When** intenta abrir el panel, la lista o el formulario de nuevo trabajo, **Then** es redirigida al inicio de sesión.

---

### User Story 4 - Cancelar o recuperarse de un error al publicar (Priority: P3)

Si la administradora se arrepiente, puede volver a la lista sin guardar nada. Si algo falla al guardar (por ejemplo, se cae la conexión), ve un mensaje sencillo y no pierde lo que escribió ni la foto elegida más allá de lo imprescindible, y puede reintentar.

**Why this priority**: Mejora la confianza y reduce la frustración en celular con señal irregular, pero el flujo básico funciona sin ello.

**Independent Test**: Abrir "Nuevo trabajo", llenar los campos y volver atrás: no debe existir ningún trabajo nuevo. Simular un fallo de guardado y comprobar que el mensaje es claro y se puede reintentar.

**Acceptance Scenarios**:

1. **Given** el formulario parcialmente lleno, **When** la administradora vuelve a la lista sin publicar, **Then** no se crea ningún trabajo.
2. **Given** que el guardado falla, **When** ocurre el error, **Then** ve un mensaje en lenguaje sencillo, conserva título, descripción y categoría, y puede pulsar "Publicar" de nuevo.
3. **Given** que pulsa "Publicar" y la subida tarda, **When** espera, **Then** ve que se está procesando y no puede crear duplicados pulsando varias veces.

---

### Edge Cases

- ¿Qué pasa si la foto es HEIC, el formato habitual de algunos iPhone? El celular la convierte a JPEG al elegirla; si llegara un HEIC sin convertir, se rechaza con el mensaje de formato no admitido. Ver Assumptions y la pregunta abierta del PRD sobre formatos reales.
- ¿Qué pasa si la administradora pulsa "Publicar" dos veces seguidas? Solo se crea un trabajo.
- ¿Qué pasa si la sesión caduca mientras llena el formulario? Al publicar es redirigida al inicio de sesión; no se guarda nada a medias.
- ¿Qué pasa si el título o la descripción son muy largos? Se limitan a un máximo razonable con un mensaje claro al exceder.
- ¿Qué pasa si el título o la descripción contienen código o símbolos especiales? Se guardan y se muestran como texto, sin ejecutarse.
- ¿Qué pasa si falla la preparación de la foto a mitad del proceso? No queda un trabajo publicado sin foto ni archivos huérfanos; la administradora ve un mensaje sencillo.
- ¿Qué pasa si una foto es muy pequeña o de muy baja resolución? Se acepta; la versión grande no se agranda artificialmente.
- ¿Qué pasa en una pantalla de escritorio? El panel sigue siendo utilizable, aunque el diseño de escritorio del panel no está definido aún.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Al entrar con sesión válida, el panel MUST mostrar el título "Mis trabajos", el logo pequeño, el botón "Salir", el botón "+ Nuevo trabajo" y la lista de trabajos, según la pantalla 4 de los mockups.
- **FR-002**: La lista MUST mostrar por cada trabajo su miniatura, su título (o, si no tiene, su categoría) y su categoría, ordenados del más reciente al más antiguo.
- **FR-003**: Cuando no existan trabajos, el panel MUST mostrar un mensaje amable que invite a crear el primero, en lugar de una pantalla vacía.
- **FR-004**: El botón "+ Nuevo trabajo" MUST abrir el formulario de nuevo trabajo, según la pantalla 5 de los mockups.
- **FR-005** *(el título pasa a obligatorio en la spec 004)*: El formulario MUST pedir foto y categoría como obligatorios, y título y descripción como opcionales, con un único botón "Publicar".
- **FR-006**: El campo de foto MUST permitir elegir una imagen desde la galería o tomarla con la cámara del celular.
- **FR-007**: El formulario MUST mostrar una vista previa de la foto elegida antes de publicar.
- **FR-008**: La categoría MUST elegirse de la lista fija: Tortas, Postres, Rollos y Otros.
- **FR-009**: Si falta la foto o la categoría, el sistema MUST impedir la publicación y mostrar un mensaje claro que indique el campo faltante, sin borrar lo ya escrito.
- **FR-010**: El sistema MUST aceptar fotos en formatos de imagen comunes (JPEG, PNG y WebP; las fotos HEIC de iPhone se convierten a JPEG al elegirlas) y MUST rechazar cualquier otro tipo de archivo con un mensaje claro, verificando el contenido real y no solo el nombre o la extensión.
- **FR-011**: El sistema MUST rechazar fotos que superen el tamaño máximo permitido, con un aviso comprensible que indique el límite.
- **FR-012**: El sistema MUST corregir la orientación de la foto y generar tres versiones (miniatura, mediana y grande) en un formato eficiente para web.
- **FR-013**: El sistema MUST eliminar de toda foto publicada los metadatos, en especial la ubicación GPS.
- **FR-014**: Ningún trabajo MUST quedar publicado sin sus versiones de foto completas, ni quedar archivos de foto sin trabajo asociado tras un fallo.
- **FR-015**: Al publicar con éxito, el sistema MUST guardar el trabajo y llevar a la administradora a la lista, donde el nuevo trabajo aparece.
- **FR-016**: Mientras se procesa la publicación, el formulario MUST indicar que está trabajando y evitar envíos duplicados.
- **FR-017**: Ante un fallo de guardado, el sistema MUST mostrar un mensaje en lenguaje sencillo, conservar los campos de texto y la categoría y permitir reintentar.
- **FR-018**: Un trabajo publicado MUST guardar su foto, categoría, título y descripción opcionales y la fecha de creación, de modo que el catálogo público pueda usarlos en un hito posterior.
- **FR-019**: Todas las pantallas y acciones del panel (lista, formulario y publicación) MUST requerir sesión iniciada; sin ella, la administradora es redirigida al inicio de sesión.
- **FR-020**: Los textos de título y descripción MUST tratarse siempre como texto plano y tener un largo máximo con mensaje claro al excederlo.
- **FR-021**: Las pantallas MUST seguir el diseño de los mockups: móvil primero, botones y campos táctiles de al menos 44 px, contraste mínimo 4.5:1, marca y tipografía definidas, y navegación por teclado en el panel.
- **FR-022**: Las imágenes de la lista MUST tener texto alternativo, y los errores del formulario MUST anunciarse de forma accesible.

### Key Entities *(include if feature involves data)*

- **Trabajo**: una pieza de repostería publicada por la administradora. Tiene una foto (en tres tamaños), una categoría, un título opcional, una descripción opcional y la fecha de creación. Es lo que más adelante verá el público en el catálogo.
- **Categoría**: agrupación fija de trabajos (Tortas, Postres, Rollos, Otros). Cada trabajo pertenece a exactamente una.
- **Foto**: imagen asociada a un trabajo, disponible en versiones miniatura, mediana y grande, sin metadatos.
- **Administradora**: única persona con acceso al panel (entidad ya existente por el inicio de sesión).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La administradora puede publicar un trabajo completo (foto, categoría, título y descripción) en menos de 1 minuto desde un celular real.
- **SC-002**: Un trabajo con solo foto y categoría se publica correctamente en el 100 % de los intentos con datos válidos.
- **SC-003**: El 100 % de las fotos publicadas carecen de metadatos de ubicación, verificado con una herramienta estándar de lectura de metadatos.
- **SC-004**: La versión mediana de una foto típica de celular pesa como máximo unos cientos de KB y la miniatura mucho menos, de modo que la lista cargue de forma fluida en celular.
- **SC-005**: El 100 % de los archivos que no son imágenes aceptadas se rechazan con un mensaje claro, y ninguno llega a publicarse.
- **SC-006**: En una primera prueba con la administradora real, completa la creación de su primer trabajo sin ayuda ni explicaciones adicionales.
- **SC-007**: Las pantallas del panel obtienen al menos 90 puntos en Lighthouse móvil y cumplen contraste y accesibilidad por teclado.
- **SC-008**: El flujo se prueba y funciona en un celular real, no solo en escritorio.
- **SC-009**: Ninguna ruta del panel es accesible sin sesión iniciada.

## Assumptions

- La administradora ya puede iniciar sesión y es redirigida al panel (funcionalidad 002); esta funcionalidad reemplaza el contenido provisional actual del panel.
- Las categorías son las cuatro fijas de los mockups (Tortas, Postres, Rollos, Otros); gestionarlas (crear, renombrar, ocultar; HU-11) queda fuera de alcance.
- Se aceptan JPEG, PNG y WebP. HEIC no se lista en el selector: iOS lo convierte a JPEG al elegir la foto (ADR 0005). El formato real del celular de la administradora se confirma en la prueba con su celular.
- El tamaño máximo de foto y el peso objetivo de cada versión se fijarán en la planificación, respetando los ADR 0004 y 0005 y los límites del plan gratuito.
- El orden en la lista es siempre el más reciente primero; ordenar o destacar trabajos (HU-12) queda fuera de alcance.
- Que el trabajo "aparezca en el catálogo público" (HU-07) se cumple en el Hito 4; aquí basta con que quede guardado y listo para mostrarse.
- Fuera de alcance *(reemplazado por la [spec 004](../004-editar-retirar-trabajos/spec.md): editar, retirar y reemplazar la foto ya están implementados)*: editar y retirar trabajos y su diálogo de confirmación (Hito 5; HU-09, HU-10), reemplazar la foto, catálogo público y detalle, WhatsApp, gestión de categorías, versión de escritorio del panel y estados de carga/error de foto más elaborados de lo descrito.
- *(Reemplazado por la spec 004: la lista ya muestra "Editar" y "Retirar".)* En esta lista, los botones "Editar" y "Retirar" de los mockups no se muestran hasta que existan esas funciones.
- Debe respetarse el costo $0 recurrente (principio I) y la validación en dispositivo móvil real (principio II).
- Debe haber pruebas automatizadas para la validación del formulario, el rechazo de archivos inválidos, la eliminación de metadatos y el flujo de creación (principio V).
