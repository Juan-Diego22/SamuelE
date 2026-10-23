# Feature Specification: Editar y retirar los trabajos del panel

**Feature Branch**: `feature/004-editar-retirar-trabajos`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "Cada publicación debe permitirle a la administradora poder editar el trabajo o retirarlo con el mensaje que se ve en el mockup 'Panel: Lista'. Además, agregar los placeholders que se visualizan en el mockup del formulario 'Panel: Nuevo', incluida la imagen de cámara con su descripción."

**Referencias**: `docs/prd-fase-1.md` (HU-09 Editar un trabajo, HU-10 Retirar un trabajo), `.specify/memory/constitution.md` (principios I, II, III, IV, V), `docs/adr/0004-almacenamiento-de-imagenes.md`, `docs/adr/0005-optimizacion-de-imagenes.md`, `docs/design/mockups.md` (pantallas 4 y 5), `docs/design/mockups.html` (botones "Panel: Lista" y "Panel: Nuevo"), `docs/design/5 · Panel lista + confirmar.png` y `specs/003-panel-nuevo-trabajo/` (lista y formulario de nuevo trabajo ya construidos).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retirar un trabajo con confirmación (Priority: P1)

En la lista "Mis trabajos", cada tarjeta muestra los botones "Editar" y "Retirar". Al pulsar "Retirar" aparece un diálogo "¿Retirar este trabajo?" con el texto "Dejará de verse en el catálogo público." y los botones "Cancelar" y "Retirar". Si confirma, el trabajo desaparece de la lista; si cancela, no pasa nada.

**Why this priority**: Es obligatorio (HU-10, Must) y es la acción con más riesgo: una foto equivocada o un producto que ya no se ofrece no debe seguir a la vista de los clientes. La confirmación evita retiros por un toque accidental en el celular.

**Independent Test**: Con dos trabajos publicados, pulsar "Retirar" en uno, cancelar y comprobar que sigue en la lista; volver a pulsar "Retirar", confirmar y comprobar que desaparece y que el otro sigue allí, también tras recargar la página.

**Acceptance Scenarios**:

1. **Given** la lista con trabajos, **When** la administradora mira una tarjeta, **Then** ve la miniatura, el título (o la categoría si no tiene título), la categoría y los botones "Editar" y "Retirar".
2. **Given** la lista, **When** pulsa "Retirar" en un trabajo, **Then** aparece el diálogo "¿Retirar este trabajo?" con el texto "Dejará de verse en el catálogo público." y los botones "Cancelar" y "Retirar", y el resto de la pantalla queda inactivo detrás.
3. **Given** el diálogo abierto, **When** pulsa "Cancelar" (o la tecla Escape), **Then** el diálogo se cierra y el trabajo sigue en la lista sin cambios.
4. **Given** el diálogo abierto, **When** pulsa "Retirar", **Then** el trabajo desaparece de la lista, ve un aviso breve de que se retiró y el trabajo ya no se muestra al recargar la página.
5. **Given** que retira el último trabajo, **When** la lista queda vacía, **Then** ve el mensaje de lista vacía de siempre.
6. **Given** un trabajo retirado, **When** se construya el catálogo público, **Then** ese trabajo no debe aparecer (la información de retiro queda guardada para que el catálogo la respete).

---

### User Story 2 - Editar un trabajo publicado (Priority: P1)

Al pulsar "Editar" en una tarjeta, se abre la pantalla "Editar trabajo", igual al formulario de nuevo trabajo pero ya llena con la foto actual, la categoría, el título y la descripción. La administradora cambia lo que necesite, incluida la foto, y pulsa "Guardar". Vuelve a la lista con los cambios aplicados.

**Why this priority**: Es obligatorio (HU-09, Must). Corregir un título, cambiar de categoría o reemplazar una foto borrosa es el uso cotidiano; sin esto tendría que retirar y volver a publicar.

**Independent Test**: Editar un trabajo cambiando solo el título y comprobar que la lista lo refleja y que la foto no cambió; editar otro reemplazando la foto y comprobar que se ve la nueva, sin metadatos de ubicación.

**Acceptance Scenarios**:

1. **Given** un trabajo publicado, **When** pulsa "Editar", **Then** la pantalla se titula "Editar trabajo" y muestra la foto actual como vista previa, la categoría seleccionada, el título y la descripción actuales.
2. **Given** la pantalla de edición, **When** cambia título, descripción o categoría y pulsa "Guardar", **Then** vuelve a la lista y ve los cambios, con la foto sin tocar.
3. **Given** la pantalla de edición, **When** elige una foto nueva, **Then** ve su vista previa en lugar de la actual y, al guardar, el trabajo muestra la foto nueva en todos sus tamaños, corregida de orientación y sin metadatos (misma preparación que al publicar).
4. **Given** la pantalla de edición, **When** guarda sin cambiar la foto, **Then** no se vuelve a subir ninguna foto.
5. **Given** que borra la descripción, **When** guarda, **Then** el trabajo queda sin descripción y se guarda correctamente.
6. **Given** que borra el título (o el trabajo era uno antiguo sin título), **When** pulsa "Guardar", **Then** no se guarda, ve el mensaje "Escribe un título." y conserva lo demás.
7. **Given** la pantalla de edición, **When** elige un archivo que no es una imagen aceptada o es demasiado pesado, **Then** se rechaza con los mismos mensajes que al publicar, y la foto actual y lo demás escrito se conservan.
8. **Given** la pantalla de edición, **When** pulsa "Cancelar", **Then** vuelve a la lista sin guardar nada.
9. **Given** un fallo al guardar (por ejemplo, se cae la conexión), **When** ocurre, **Then** ve un mensaje sencillo, conserva lo que escribió y puede reintentar, y el trabajo conserva su foto y datos anteriores intactos.

---

### User Story 3 - Zona de foto y textos de ayuda en el formulario (Priority: P2)

En el formulario de nuevo trabajo (y en el de edición), la zona de la foto se ve como en el mockup "Panel: Nuevo": un recuadro de borde punteado dorado con un ícono de cámara grande, el texto "Toca para subir foto" y, más pequeño debajo, "Galería o cámara". Los campos muestran textos de ejemplo: "Ej: Torta de Chocolate" en el título y "Describe los ingredientes, tamaño, etc." en la descripción; el selector de categoría empieza en "Selecciona una categoría". Los campos obligatorios (Foto y Categoría) llevan un asterisco rojo.

**Why this priority**: Hace el formulario más claro para quien lo usa por primera vez y lo deja fiel al diseño aprobado. No cambia lo que el sistema puede hacer, por eso va después de editar y retirar.

**Independent Test**: Abrir "Nuevo trabajo" en un celular y comprobar que la zona de foto, los textos de ayuda y los asteriscos coinciden con el mockup, que tocar cualquier punto del recuadro abre la galería o la cámara y que, al elegir una foto, se ve su vista previa.

**Acceptance Scenarios**:

1. **Given** el formulario sin foto elegida, **When** lo abre, **Then** ve el recuadro punteado dorado con el ícono de cámara grande, "Toca para subir foto" y "Galería o cámara" debajo en letra más pequeña.
2. **Given** el recuadro, **When** toca cualquier punto dentro de él, **Then** se abre el selector de foto del celular (galería o cámara).
3. **Given** que elige una foto válida, **When** vuelve al formulario, **Then** el recuadro muestra la vista previa de la foto y sigue siendo posible tocarlo para cambiarla.
4. **Given** el título vacío, **When** lo ve, **Then** aparece el texto de ejemplo "Ej: Torta de Chocolate"; **Given** la descripción vacía, **Then** aparece "Describe los ingredientes, tamaño, etc."; y al escribir, esos textos desaparecen.
5. **Given** el selector de categoría sin elegir, **When** lo ve, **Then** su primera opción dice "Selecciona una categoría" y las demás son Tortas, Postres, Rollos y Otros.
6. **Given** el formulario de nuevo trabajo, **When** pulsa "Publicar" con el título vacío (o solo espacios), **Then** no se guarda nada, ve el mensaje "Escribe un título." junto al campo y conserva lo demás.
7. **Given** el formulario, **When** lo ve, **Then** "Foto", "Categoría" y "Título" llevan un asterisco rojo y "Descripción" no.
8. **Given** una persona que usa lector de pantalla o teclado, **When** recorre el formulario, **Then** cada campo conserva su etiqueta visible y accesible (los textos de ejemplo no sustituyen a las etiquetas), el ícono de cámara no se lee como contenido y la zona de foto se puede activar con el teclado.
9. **Given** la pantalla de edición, **When** la abre, **Then** tiene la misma zona de foto, los mismos textos de ayuda y los mismos asteriscos, con la foto actual como vista previa.

---

### Edge Cases

- ¿Qué pasa si pulsa "Retirar" dos veces seguidas o dos pestañas retiran el mismo trabajo? Solo se retira una vez; la segunda vez ve que ya no está disponible, sin error confuso.
- ¿Qué pasa si falla el retiro (sin conexión)? El diálogo muestra un mensaje sencillo, el trabajo sigue en la lista y puede reintentar.
- ¿Qué pasa si la sesión caduca con el diálogo o el formulario abiertos? Al confirmar o guardar es redirigida al inicio de sesión y no se cambia nada a medias.
- ¿Qué pasa si abre "Editar" de un trabajo ya retirado o inexistente? Ve un mensaje claro de que el trabajo no está disponible y un botón para volver a la lista.
- ¿Qué pasa si reemplaza la foto y falla la preparación o el guardado? El trabajo conserva la foto anterior completa; nunca queda con fotos a medias.
- ¿Qué pasa si dos personas o pestañas editan el mismo trabajo? Prevalece el último guardado; no se exige bloqueo (hay una sola administradora).
- ¿Qué pasa si el título o la descripción exceden el largo máximo al editar? Mismo mensaje que al publicar, sin perder lo escrito.
- ¿Qué pasa si el título es muy largo en la tarjeta? Se muestra sin desbordar la pantalla.
- ¿Qué pasa con la foto antigua tras reemplazarla? La administradora ya no la ve en ningún lugar; el sistema no debe seguir mostrando la versión anterior ni por caché.
- ¿Qué pasa si el navegador no admite el diálogo modal? El retiro sigue pidiendo confirmación (no se retira sin preguntar).
- ¿Qué pasa si abre el formulario de edición y no cambia nada? Guardar vuelve a la lista sin error y sin subir fotos.
- ¿Qué pasa con las tarjetas en pantallas de escritorio? Siguen siendo utilizables; el diseño de escritorio del panel sigue sin definirse.

## Requirements *(mandatory)*

### Functional Requirements

**Retirar**

- **FR-001**: Cada tarjeta de la lista MUST mostrar los botones "Editar" y "Retirar", según la pantalla 4 de los mockups.
- **FR-002**: Al pulsar "Retirar", el sistema MUST mostrar un diálogo modal con el título "¿Retirar este trabajo?", el texto "Dejará de verse en el catálogo público." y los botones "Cancelar" y "Retirar"; "Retirar" usa el color de acción destructiva.
- **FR-003**: El retiro MUST ocurrir solo tras confirmar en el diálogo; "Cancelar" y la tecla Escape cierran el diálogo sin cambios.
- **FR-004**: Al confirmar, el trabajo MUST dejar de mostrarse en la lista del panel, y la administradora MUST ver un aviso de que se retiró.
- **FR-005**: El retiro MUST conservar el registro del trabajo marcado como retirado (borrado lógico) y MUST excluirlo de cualquier listado y vista pública futura; restaurar trabajos retirados está fuera de alcance.
- **FR-006**: El diálogo MUST ser accesible: el foco entra al diálogo al abrirse, queda dentro de él mientras está abierto y vuelve al botón que lo abrió al cerrarse sin retirar; anuncia su título a lectores de pantalla; sus botones miden al menos 44 px.
- **FR-007**: Retirar un trabajo ya retirado o inexistente MUST resolverse sin error confuso, mostrando que el trabajo no está disponible.
- **FR-008**: Ante un fallo al retirar, el sistema MUST mostrar un mensaje sencillo, conservar el trabajo y permitir reintentar.

**Editar**

- **FR-009**: "Editar" MUST abrir la pantalla "Editar trabajo", con el mismo diseño que "Nuevo trabajo" (pantalla 5 de los mockups), precargada con la foto actual, la categoría, el título y la descripción del trabajo.
- **FR-010**: La pantalla de edición MUST tener un único botón principal "Guardar" y un botón "Cancelar" que vuelve a la lista sin guardar.
- **FR-011**: La administradora MUST poder cambiar categoría, título, descripción y foto, en cualquier combinación; la foto, la categoría y el título son obligatorios y la descripción es opcional, con los mismos largos máximos y mensajes que al publicar.
- **FR-012**: Si no se elige una foto nueva, el sistema MUST conservar la foto actual sin volver a subirla ni procesarla.
- **FR-013**: Si se elige una foto nueva, el sistema MUST aplicarle las mismas reglas que al publicar: formato real aceptado (JPEG, PNG, WebP), tamaño máximo, corrección de orientación, tres versiones (miniatura, mediana, grande) y eliminación de todos los metadatos, en especial la ubicación.
- **FR-014**: Tras reemplazar la foto, el trabajo MUST mostrar siempre la foto nueva y nunca la anterior, ni en la lista ni por copias guardadas en el navegador.
- **FR-015**: Guardar MUST ser todo o nada: ante un fallo, el trabajo conserva su foto y datos anteriores completos y la administradora conserva lo que escribió para reintentar.
- **FR-016**: El trabajo editado MUST conservar su fecha de creación y su lugar en la lista (editar no lo sube al inicio).
- **FR-017**: Mientras se guarda, el formulario MUST indicar que está trabajando y evitar envíos duplicados.
- **FR-018**: Al guardar con éxito, la administradora MUST volver a la lista y ver un aviso de que el trabajo se actualizó.

- **FR-019**: Abrir la edición de un trabajo inexistente o retirado MUST mostrar un mensaje claro de que no está disponible y un botón para volver a la lista.

**Formulario (zona de foto y textos de ayuda)**

- **FR-020**: La zona de foto del formulario (nuevo y edición) MUST mostrarse como un recuadro de borde punteado dorado con un ícono de cámara grande, el texto "Toca para subir foto" y, debajo y en letra más pequeña, "Galería o cámara", según la pantalla 5 de los mockups.
- **FR-021**: Todo el recuadro MUST ser táctil (mínimo 44 px de alto) y abrir el selector de foto del celular (galería o cámara); también MUST poder activarse con el teclado y mostrar un indicador de foco visible.
- **FR-022**: Al elegir una foto válida, el recuadro MUST mostrar su vista previa y seguir permitiendo cambiarla; en edición, empieza mostrando la foto actual.
- **FR-023**: El ícono de cámara MUST ser decorativo para tecnologías de asistencia (el texto del recuadro es lo que se anuncia) y su imagen MUST verse igual en todos los celulares y navegadores.
- **FR-024**: El campo Título MUST mostrar el texto de ejemplo "Ej: Torta de Chocolate" y el campo Descripción "Describe los ingredientes, tamaño, etc."; ambos desaparecen al escribir.
- **FR-025**: Los textos de ejemplo MUST NO sustituir a las etiquetas: cada campo conserva su etiqueta visible y accesible, y los textos de ejemplo cumplen contraste mínimo 4.5:1.
- **FR-026**: El selector de categoría MUST iniciar en la opción "Selecciona una categoría", seguida de Tortas, Postres, Rollos y Otros; esa opción inicial no es válida al enviar.
- **FR-027**: Los campos obligatorios (Foto, Categoría y Título) MUST marcarse con un asterisco rojo visible, y la marca MUST comunicarse también a lectores de pantalla (por ejemplo, como "obligatorio").
- **FR-028**: El formulario MUST mostrar y anunciar de forma accesible los mensajes de error de campo de 003 (foto o categoría faltante, formato, tamaño, largo) y el nuevo "Escribe un título." cuando el título está vacío o solo tiene espacios, tanto al publicar como al guardar, y el servidor MUST rechazar un título vacío aunque el navegador lo omita.

**Transversales**

- **FR-029**: Todas las pantallas y acciones nuevas (edición, guardado y retiro) MUST requerir sesión iniciada; sin ella, la administradora es redirigida al inicio de sesión y no se cambia nada.
- **FR-030**: Las pantallas MUST seguir los mockups: móvil primero, botones y campos táctiles de al menos 44 px, contraste mínimo 4.5:1, marca y tipografía definidas, navegación por teclado y texto alternativo en imágenes.
- **FR-031**: La solución MUST seguir en el plan gratuito de los servicios usados (principio I) y no aumentar notablemente el procesamiento por solicitud respecto a 003.

### Key Entities *(include if feature involves data)*

- **Trabajo**: pieza de repostería publicada. Además de lo que ya tiene (foto en tres tamaños, categoría, título obligatorio, descripción opcional, fecha de creación), ahora puede **editarse** (cambia categoría, textos o foto, conservando su fecha de creación) y puede estar **retirado** (con la fecha en que se retiró). Un trabajo retirado deja de mostrarse al público y en el panel, pero su registro se conserva.
- **Foto**: imagen del trabajo en tres versiones. Reemplazarla crea una versión nueva; la anterior deja de usarse.
- **Categoría**: agrupación fija (Tortas, Postres, Rollos, Otros); un trabajo puede cambiar de categoría al editarse.
- **Administradora**: única persona con acceso al panel y a estas acciones.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La administradora puede retirar un trabajo (pulsar "Retirar" y confirmar) en menos de 10 segundos desde la lista en un celular real.
- **SC-002**: El 100 % de los retiros exigen confirmación: ningún trabajo se retira con un solo toque.
- **SC-003**: Tras retirar, el trabajo no vuelve a aparecer en la lista en ningún intento posterior, incluso tras recargar o volver a iniciar sesión.
- **SC-004**: Corregir el título o la categoría de un trabajo toma menos de 30 segundos; reemplazar su foto, menos de 1 minuto, desde un celular real.
- **SC-005**: El 100 % de las fotos reemplazadas carecen de metadatos de ubicación, verificado con una herramienta estándar de lectura de metadatos, igual que en 003.
- **SC-006**: Tras reemplazar una foto, el 100 % de las vistas (la lista y la edición) muestran la nueva, nunca la anterior, sin que la administradora tenga que limpiar el navegador.
- **SC-007**: Un guardado fallido nunca deja un trabajo con foto incompleta o ausente: en el 100 % de los fallos simulados el trabajo conserva sus datos y foto anteriores.
- **SC-008**: En una primera prueba con la administradora real, ubica y usa "Editar" y "Retirar" sin ayuda ni explicaciones.
- **SC-009**: La zona de foto, los textos de ayuda y los asteriscos coinciden con el mockup "Panel: Nuevo" en una revisión lado a lado en celular real.
- **SC-010**: Las pantallas de lista y formulario obtienen al menos 90 puntos en Lighthouse móvil, con contraste, foco y navegación por teclado verificados, incluido el diálogo de retiro.
- **SC-011**: Ninguna de las nuevas rutas ni acciones es accesible sin sesión iniciada.

## Assumptions

- Esta funcionalidad se apoya en el panel de 003 (lista y "Nuevo trabajo") y en el inicio de sesión de 002; reemplaza la nota de 003 que ocultaba los botones "Editar" y "Retirar" hasta que existieran.
- **Retiro = borrado lógico, sin restaurar.** El trabajo se marca como retirado y se conserva; no hay pantalla ni botón para recuperarlo (queda para una fase posterior si hace falta). Requiere una migración propia, como ya anticipaba el modelo de datos de 003.
- **Archivos de un trabajo retirado.** Las fotos de un trabajo retirado se conservan (no se borran) y dejan de ser accesibles públicamente por ese trabajo; la limpieza definitiva de retirados queda fuera de alcance.
- **Foto reemplazada.** La versión anterior de las fotos deja de usarse; si se elimina o queda huérfana de forma temporal lo definirá el plan, siempre sin que la administradora vea la anterior y sin dejar al trabajo sin foto ante un fallo. El número de versión de la foto del trabajo sube con cada reemplazo, como ya prevé el modelo de datos de 003.
- **El detalle de un trabajo no se incluye aquí.** Le corresponde al catálogo público (con su botón "Preguntar por WhatsApp"); en el panel, la administradora edita y retira desde la lista.
- **El ícono de cámara** del mockup se reproduce con una imagen propia que se vea igual en cualquier celular (no depende del emoji del sistema); el estilo exacto lo decide el plan, respetando colores y marca.
- **Botón de guardado.** En edición el botón principal dice "Guardar" (en nuevo sigue "Publicar"), por ser la acción natural al modificar algo ya publicado; el mockup indica "un solo botón" por pantalla y se mantiene.
- Las categorías siguen siendo las cuatro fijas; gestionarlas (HU-11) queda fuera de alcance. Ordenar o destacar trabajos (HU-12) también.
- Hay una sola administradora; no se requiere control de ediciones simultáneas (prevalece el último guardado).
- Mensajes, formato de fotos, tamaños máximos y límites de título y descripción son los de 003; editar no los cambia.
- **El título pasa a ser obligatorio** en el formulario de nuevo trabajo y en el de edición (en 003 era opcional); la descripción sigue opcional. La regla se valida también en el servidor. Los trabajos ya publicados sin título siguen mostrándose con su categoría como título en la lista, pero la administradora debe escribir un título para poder guardar su edición.
- Debe respetarse el costo $0 recurrente (principio I), la validación en celular real (principio II) y pruebas automatizadas para la lógica de edición, retiro y exclusión de retirados, la preparación de la foto reemplazada y los flujos críticos (principio V).
- Fuera de alcance: catálogo público y el detalle de un trabajo, WhatsApp, gestión de categorías, destacar/ordenar trabajos, restaurar trabajos retirados, versión de escritorio del panel y limpieza definitiva de archivos retirados.
