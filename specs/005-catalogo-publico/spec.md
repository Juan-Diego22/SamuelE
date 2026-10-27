# Feature Specification: Catálogo público y detalle de trabajo con WhatsApp

**Feature Branch**: `feature/005-catalogo-publico`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Catálogo público y detalle de trabajo con WhatsApp (cierra la Fase 1). Reemplazar el placeholder 'Nuestro catálogo estará disponible muy pronto' de la página de inicio por el catálogo público real, el enlace que se comparte con los clientes, tal como en los mockups 'Catálogo', 'Detalle' y 'Responsivo'. Cada trabajo debe permitir entrar al detalle, con el botón 'Preguntar por WhatsApp' funcional (por ahora con el número del desarrollador para pruebas, luego el de la administradora)."

**Referencias**: `docs/prd-fase-1.md` (HU-01, HU-02, HU-03, HU-04, HU-05, HU-13, HU-15), `.specify/memory/constitution.md` (principios I, II, III, IV, V), `docs/design/mockups.md` (pantallas 1, 2 y 6), `docs/design/mockups.html` (botones "Catálogo", "Detalle" y "Responsivo"), `docs/adr/0004-almacenamiento-de-imagenes.md`, `specs/003-panel-nuevo-trabajo/` y `specs/004-editar-retirar-trabajos/` (trabajos, fotos, edición y retiro ya construidos).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el catálogo y filtrar por categoría (Priority: P1)

Una clienta abre el enlace que le compartieron y ve la página principal con la cabecera de Samuelé Repostería (logo, nombre y lema), una fila de categorías (Todos, Tortas, Postres, Rollos, Otros) y los trabajos publicados en una grilla de fotos, cada una con su título y su categoría. Al tocar una categoría ve solo los trabajos de esa categoría.

**Why this priority**: Es el producto principal de la Fase 1 (HU-01, Must): sin el catálogo público, todo el panel no tiene a quién servir. Por sí sola ya permite compartir el enlace y mostrar el trabajo.

**Independent Test**: Con trabajos publicados en al menos dos categorías, abrir la página principal en un celular, comprobar que aparecen todos, tocar una categoría y comprobar que solo quedan los de esa categoría y que "Todos" los devuelve.

**Acceptance Scenarios**:

1. **Given** trabajos publicados, **When** una persona abre la página principal sin iniciar sesión, **Then** ve la cabecera con logo, nombre y lema, las categorías "Todos", "Tortas", "Postres", "Rollos" y "Otros" y la grilla de trabajos.
2. **Given** la grilla, **When** la mira en un celular, **Then** ve dos trabajos por fila; en tableta o escritorio ve tres por fila, con el diseño del mockup "Responsivo".
3. **Given** un trabajo en la grilla, **When** lo mira, **Then** ve su foto en miniatura, su categoría, su título y un botón "Ver detalles"; si el trabajo es antiguo y no tiene título, ve su categoría como título.
4. **Given** varios trabajos, **When** mira la grilla, **Then** el más reciente aparece primero.
5. **Given** la página principal, **When** toca "Tortas", **Then** ve solo los trabajos de Tortas, la categoría elegida se distingue visualmente de las demás y la dirección de la página refleja el filtro (se puede compartir o recuperar al volver).
6. **Given** un filtro activo, **When** toca "Todos", **Then** vuelve a ver todos los trabajos.
7. **Given** una categoría sin trabajos, **When** la toca, **Then** ve un mensaje amable de que todavía no hay trabajos en esa categoría y puede volver a "Todos".
8. **Given** que no hay ningún trabajo publicado, **When** abre la página principal, **Then** ve un mensaje amable de que el catálogo está en preparación (no una pantalla en blanco), con la cabecera y el pie.
9. **Given** más categorías de las que caben en el ancho del celular, **When** desliza la fila de categorías, **Then** se desplaza horizontalmente solo esa fila, sin que la página completa se desplace de lado.

---

### User Story 2 - Ver el detalle de un trabajo y preguntar por WhatsApp (Priority: P1)

La clienta toca un trabajo y llega a su página de detalle: foto grande, etiqueta de categoría, título y descripción (si la tiene). Pulsa "Preguntar por WhatsApp" y se abre WhatsApp con una conversación hacia la repostería y un mensaje ya escrito que menciona ese trabajo. Con "← Volver" regresa al catálogo en el mismo filtro y en el mismo punto donde estaba.

**Why this priority**: Es obligatorio (HU-02 y HU-03, Must) y es la razón de ser del catálogo: pasar de ver una torta a pedirla con un toque. Sin el botón, el catálogo no genera contactos.

**Independent Test**: Desde el catálogo, tocar un trabajo, comprobar foto, categoría, título y descripción; pulsar "Preguntar por WhatsApp" y comprobar que abre la conversación con el número configurado y el mensaje que menciona el trabajo; pulsar "← Volver" y comprobar que se conserva el filtro y la posición.

**Acceptance Scenarios**:

1. **Given** un trabajo en la grilla, **When** lo toca (en cualquier punto de la tarjeta), **Then** abre su página de detalle con la foto grande, la etiqueta de categoría, el título y, si la tiene, la descripción, según el mockup "Detalle".
2. **Given** un trabajo sin descripción, **When** abre su detalle, **Then** no ve un espacio vacío ni texto de relleno donde iría la descripción.
3. **Given** el detalle, **When** pulsa "Preguntar por WhatsApp", **Then** se abre WhatsApp con el número de contacto configurado y un mensaje ya escrito que la clienta solo tiene que enviar, sin copiar ni escribir nada: «Hola Samuelé, me interesa el trabajo "Torta de Chocolate". ¿Me puedes dar más información?».
4. **Given** el detalle, **When** pulsa "← Volver", **Then** regresa al catálogo con el mismo filtro de categoría y en la misma posición de la lista donde estaba.
5. **Given** que llegó al detalle directamente desde un enlace compartido (sin pasar por el catálogo), **When** pulsa "← Volver", **Then** va al catálogo completo.
6. **Given** una dirección de detalle de un trabajo retirado o que no existe, **When** alguien la abre, **Then** ve una página amable de "Este trabajo ya no está disponible" con un botón para ir al catálogo, y no se revela nada del trabajo retirado.
7. **Given** el detalle de un trabajo, **When** lo mira, **Then** no ve precios ni leyendas repetidas debajo del botón de WhatsApp (la leyenda "Cotiza por WhatsApp" vive solo en el pie del catálogo).

---

### User Story 3 - Contacto en el pie del catálogo (Priority: P1)

Al final del catálogo hay un pie con el contacto por WhatsApp (el número) y la leyenda "Cotiza por WhatsApp". No hay botón flotante: el botón "Preguntar por WhatsApp" del detalle es la vía principal para preguntar por un trabajo. El número y los mensajes se definen en un solo lugar para poder cambiarlos por los reales de la administradora sin tocar las pantallas.

**Why this priority**: Es obligatorio (HU-03, Must) que el contacto por WhatsApp esté a un toque; el detalle lo cubre por trabajo y el pie le da un dato de contacto general visible (HU-05, reducido a lo esencial). Que el número sea intercambiable es lo que permite probar hoy con un número de prueba y pasar a producción real después.

**Independent Test**: En el catálogo, tocar el WhatsApp del pie y comprobar que abre la conversación con un mensaje general; comprobar que el catálogo no tiene botón flotante; cambiar el número en la configuración central y comprobar que el botón del detalle y el pie usan el nuevo número.

**Acceptance Scenarios**:

1. **Given** el catálogo, **When** la clienta se desplaza por la lista, **Then** no hay ningún botón flotante que tape el contenido; el contacto está en el pie.
2. **Given** el pie, **When** toca el WhatsApp, **Then** se abre WhatsApp hacia el número configurado con un mensaje general de saludo (sin mencionar un trabajo concreto).
3. **Given** el final de la página, **When** lo mira, **Then** ve el pie con la sección CONTACTO que muestra el WhatsApp con el número y la leyenda "Cotiza por WhatsApp", sin ningún precio y sin zona de atención, anticipación ni teléfono aparte.
4. **Given** que se cambia el número de contacto en la configuración central, **When** se vuelve a abrir el sitio, **Then** el botón del detalle y el pie muestran y usan el número nuevo, sin editar ninguna pantalla.
5. **Given** el número de WhatsApp con espacios, signos o prefijo (por ejemplo "+57 300 123 4567"), **When** se arma el enlace de WhatsApp, **Then** funciona correctamente con solo los dígitos del número, y el pie lo muestra con formato legible.

---

### User Story 4 - El catálogo refleja lo que cambia la administradora (Priority: P1)

Cuando la administradora publica un trabajo, edita su título, categoría, descripción o foto, o lo retira desde el panel, el catálogo público lo muestra así la próxima vez que alguien lo abra, sin que nadie tenga que desplegar ni limpiar nada.

**Why this priority**: Es lo que convierte el panel en útil (HU-07, HU-09, HU-10 se cierran aquí: "al guardar, el trabajo aparece en el catálogo público"). Un catálogo que muestra datos viejos contradice el diálogo "Dejará de verse en el catálogo público".

**Independent Test**: Publicar un trabajo y verlo en el catálogo; editar su título y su foto y verificar el cambio; retirarlo y verificar que desaparece del catálogo y que su dirección de detalle muestra "no disponible".

**Acceptance Scenarios**:

1. **Given** el catálogo abierto, **When** la administradora publica un trabajo y se recarga el catálogo, **Then** el trabajo aparece al inicio de la grilla.
2. **Given** un trabajo publicado, **When** la administradora cambia su título, categoría o descripción, **Then** el catálogo y el detalle muestran los datos nuevos al recargar, y el trabajo aparece bajo su nueva categoría.
3. **Given** un trabajo publicado, **When** la administradora reemplaza su foto, **Then** el catálogo y el detalle muestran la foto nueva y nunca la anterior, sin limpiar el navegador.
4. **Given** un trabajo publicado, **When** la administradora lo retira, **Then** deja de aparecer en el catálogo y su detalle muestra "no disponible", incluso para quien tenía abierta la dirección.
5. **Given** que cualquiera de estos cambios ocurrió, **When** pasa un tiempo corto razonable, **Then** ninguna persona nueva que abra el catálogo ve la información anterior.

---

### User Story 5 - Compartir el enlace con una buena vista previa (Priority: P2)

Cuando la administradora pega el enlace del catálogo en WhatsApp o Instagram, aparece una vista previa con el nombre del negocio, una breve descripción y una imagen atractiva, en lugar de un enlace pelado. Lo mismo para el enlace de un trabajo concreto, que muestra el título y la foto de ese trabajo.

**Why this priority**: HU-04 (Should): mejora mucho cómo se ve y cuánta confianza da el enlace que se comparte, pero el catálogo funciona sin ella.

**Independent Test**: Pegar el enlace principal y el de un detalle en un chat de WhatsApp (o en un validador de vista previa) y comprobar título, descripción e imagen.

**Acceptance Scenarios**:

1. **Given** el enlace principal, **When** se comparte en WhatsApp o Instagram, **Then** la vista previa muestra "Samuelé Repostería", el lema o una descripción corta y la imagen de marca.
2. **Given** el enlace de un trabajo, **When** se comparte, **Then** la vista previa muestra el título del trabajo, el nombre del negocio y la foto de ese trabajo.
3. **Given** un trabajo retirado, **When** se comparte su enlace, **Then** la vista previa no muestra su foto ni su título.

---

### User Story 6 - Errores y carga amables (Priority: P2)

Si algo falla al cargar el catálogo, la persona ve un mensaje sencillo con la posibilidad de reintentar, no una pantalla rota. Mientras las fotos cargan, la grilla no "salta" ni se ve vacía.

**Why this priority**: HU-15 (Should): el catálogo se abre desde datos celulares, donde fallar es normal; el mensaje evita que la clienta piense que la página no existe.

**Independent Test**: Simular un fallo al leer los trabajos y comprobar el mensaje y el reintento; abrir el catálogo con conexión lenta y comprobar que el diseño no se mueve al aparecer las fotos.

**Acceptance Scenarios**:

1. **Given** un fallo al cargar los trabajos, **When** se abre el catálogo, **Then** ve la cabecera y el pie junto con un mensaje sencillo ("No pudimos cargar los trabajos. Intenta de nuevo en un momento.") y un modo de reintentar, y ninguna información técnica.
2. **Given** un fallo al cargar el detalle de un trabajo, **When** se abre, **Then** ve un mensaje sencillo equivalente y un botón para volver al catálogo (distinto del mensaje de "no disponible").
3. **Given** una conexión lenta, **When** cargan las fotos, **Then** cada espacio de foto ya tiene su tamaño reservado, de modo que el contenido no se mueve al aparecer las imágenes.
4. **Given** una dirección inexistente cualquiera del sitio, **When** se abre, **Then** se muestra la página 404 amable que ya existe.

---

### Edge Cases

- ¿Qué pasa si la dirección trae una categoría que no existe (por ejemplo, `?categoria=xyz`)? Se muestra el catálogo completo ("Todos") sin error.
- ¿Qué pasa si hay muchos trabajos publicados? El catálogo muestra los más recientes hasta un máximo razonable por página y ofrece ver más; nunca carga todas las fotos a la vez ni se vuelve lento. [Ver supuesto sobre el máximo.]
- ¿Qué pasa con un título muy largo en la tarjeta o el detalle? Se corta o se ajusta sin desbordar la pantalla ni producir desplazamiento horizontal.
- ¿Qué pasa con una descripción de hasta 1000 caracteres con saltos de línea? Se muestra completa, respetando los saltos de línea y sin romper el diseño; cualquier símbolo o etiqueta escrito en ella se muestra como texto, nunca se interpreta.
- ¿Qué pasa si el título contiene comillas, emojis o caracteres especiales? Se muestra tal cual y el mensaje de WhatsApp lo incluye bien codificado.
- ¿Qué pasa si falta una foto (archivo no disponible)? La tarjeta muestra un recuadro de reemplazo con el logo y no un ícono de imagen rota; el resto del catálogo sigue funcionando.
- ¿Qué pasa si el trabajo se retira mientras alguien tiene el catálogo abierto y toca su tarjeta? Ve la página "Este trabajo ya no está disponible" con el botón al catálogo.
- ¿Qué pasa si se abre el enlace de WhatsApp en un computador sin la aplicación? Se abre WhatsApp Web o la página de WhatsApp con el mensaje, que es el comportamiento estándar del enlace.
- ¿Qué pasa si la persona usa lector de pantalla o teclado? Puede recorrer las categorías, las tarjetas y los botones con teclado, con foco visible, y cada foto tiene texto alternativo.
- ¿Qué pasa con la fila de categorías cuando el filtro activo está fuera de la vista? La categoría activa queda visible.
- ¿Qué pasa si una persona abre el sitio en una pantalla muy ancha? El contenido se mantiene centrado con un ancho máximo cómodo, como en el mockup "Responsivo".
- ¿Qué pasa si el enlace del catálogo lo abre un buscador o un robot? Ve la misma página pública; las rutas del panel (`/admin`) siguen protegidas y no se muestran en ningún enlace público.

## Requirements *(mandatory)*

### Functional Requirements

**Catálogo**

- **FR-001**: La página principal MUST mostrar el catálogo público a cualquier visitante sin iniciar sesión, en lugar del mensaje "Nuestro catálogo estará disponible muy pronto".
- **FR-002**: El catálogo MUST mostrar una cabecera con el logo, el nombre "Samuelé Repostería" y el lema "Creamos momentos dulces", según los mockups 1 y 6.
- **FR-003**: El catálogo MUST mostrar una fila de categorías con "Todos" y las categorías existentes (Tortas, Postres, Rollos, Otros), con desplazamiento horizontal solo dentro de la fila cuando no caben, y con la categoría activa visualmente distinta.
- **FR-004**: Al elegir una categoría, el catálogo MUST mostrar únicamente los trabajos de esa categoría; el filtro MUST quedar reflejado en la dirección de la página para poder compartirlo, recargarlo y regresar a él.
- **FR-005**: Las categorías sin trabajos MUST seguir mostrándose en la fila (como en el mockup); al elegirlas, el catálogo MUST mostrar un mensaje claro de que aún no hay trabajos en esa categoría, con un modo de volver a "Todos".
- **FR-006**: El catálogo MUST listar solo trabajos activos (nunca retirados), del más reciente al más antiguo.
- **FR-007**: Cada trabajo MUST mostrarse como una tarjeta con su foto en miniatura, su categoría, su título (o la categoría si no tiene título) y un botón visible "Ver detalles" de al menos 44 px; toda la tarjeta (foto, texto y botón) MUST ser un único enlace táctil hacia el detalle, con un nombre accesible que diga "Ver detalles: {título}".
- **FR-008**: La grilla MUST mostrar 2 columnas en pantallas de celular y 3 en tableta y escritorio, con contenido centrado y ancho máximo en pantallas grandes, sin desplazamiento horizontal de la página en ningún tamaño.
- **FR-009**: Si no hay trabajos publicados, el catálogo MUST mostrar un mensaje amable de estado vacío, conservando cabecera y pie.
- **FR-010**: Si falla la carga de los trabajos, el catálogo MUST mostrar un mensaje sencillo sin detalles técnicos, con la cabecera y el pie, y un modo de reintentar.
- **FR-011**: El catálogo MUST limitar la cantidad de trabajos por página a un máximo razonable y ofrecer ver más, de modo que el tiempo de carga y el peso de la página no crezcan sin límite con la cantidad de trabajos.

**Detalle**

- **FR-012**: Cada trabajo MUST tener su propia página de detalle con dirección propia y estable, que muestre la foto grande, la etiqueta de categoría, el título y, solo si existe, la descripción, según el mockup 2.
- **FR-013**: La descripción MUST mostrarse completa respetando sus saltos de línea y como texto simple (cualquier marca o símbolo escrito en ella se muestra literal).
- **FR-014**: El detalle MUST ofrecer "← Volver" que regresa al catálogo conservando el filtro y la posición de la lista; si no hay catálogo previo (se llegó por un enlace directo), MUST llevar al catálogo completo.
- **FR-015**: Abrir el detalle de un trabajo retirado o inexistente MUST mostrar una página amable de "no disponible" con un botón al catálogo y con el código de respuesta correspondiente a "no encontrado"; MUST NOT revelar título, foto ni descripción del trabajo retirado.
- **FR-016**: Ante un fallo al cargar el detalle, MUST mostrarse un mensaje sencillo con un botón para volver al catálogo, distinto del de "no disponible".

**WhatsApp y datos de contacto**

- **FR-017**: El catálogo MUST NOT incluir botón flotante de WhatsApp (decisión del negocio, ajustada respecto al mockup); el WhatsApp del pie abre una conversación con el número de contacto y el mensaje general «Hola Samuelé, vi su catálogo y quiero más información.».
- **FR-018**: El botón "Preguntar por WhatsApp" del detalle MUST abrir una conversación con el número de contacto y el mensaje prellenado «Hola Samuelé, me interesa el trabajo "{título}". ¿Me puedes dar más información?», donde {título} es el título del trabajo (o, si no tiene, su categoría), de modo que la clienta pregunte por ese trabajo sin copiar nada; el texto MUST codificarse correctamente aunque tenga acentos, comillas, emojis o símbolos.
- **FR-019**: El pie del catálogo MUST mostrar la sección CONTACTO con el WhatsApp y su número (tocable para abrir la conversación) y la leyenda "Cotiza por WhatsApp". El pie MUST NOT incluir zona de atención, anticipación ni teléfono aparte (decisión del negocio, ajustada respecto al mockup).
- **FR-020**: El número de WhatsApp y el texto de los mensajes prellenados MUST definirse en un único lugar de configuración; cambiar el número MUST bastar para que el botón del detalle y el pie usen el nuevo valor, sin modificar pantallas.
- **FR-021**: El sistema MUST aceptar el número de WhatsApp escrito con espacios, signos o prefijo y MUST construir el enlace usando solo sus dígitos; si el número configurado no es válido, el despliegue o la prueba automatizada MUST fallar de forma visible en lugar de publicar un botón roto.
- **FR-022**: El número de contacto MUST ser el de la administradora; durante las pruebas se usó un número de prueba del desarrollador y se cambió al real una vez superadas.
- **FR-023**: Ninguna pantalla pública MUST mostrar precios; el catálogo indica en el pie que se cotiza por WhatsApp (sin repetirlo en cada detalle), y no existe carrito ni pago.

**Actualización con los cambios del panel**

- **FR-024**: El catálogo y el detalle MUST reflejar publicaciones, ediciones (título, categoría, descripción, foto) y retiros hechos desde el panel sin que se requiera ningún despliegue ni limpieza manual; una persona que abra el sitio después de un cambio MUST ver el estado actual en un plazo corto razonable.
- **FR-025**: Tras reemplazar una foto, las pantallas públicas MUST mostrar siempre la foto nueva y nunca la anterior, ni por copias guardadas en el navegador o en intermediarios.
- **FR-026**: Un trabajo retirado MUST desaparecer del catálogo y su detalle MUST pasar a "no disponible" en ese mismo plazo corto razonable.

**Vista previa al compartir**

- **FR-027**: La página principal MUST incluir título, descripción breve e imagen de vista previa de marca para que el enlace se vea atractivo al compartirse en WhatsApp e Instagram.
- **FR-028**: La página de detalle MUST incluir como vista previa el título y la foto del propio trabajo (y el nombre del negocio); un trabajo retirado MUST NOT exponer esa información.

**Transversales**

- **FR-029**: Todas las pantallas públicas MUST ser móvil primero y seguir los mockups: botones y zonas táctiles de al menos 44 px, texto de cuerpo de al menos 16 px, contraste mínimo 4.5:1, marca, colores y tipografía definidos, texto alternativo en todas las imágenes de trabajos, foco visible y navegación completa por teclado.
- **FR-030**: Las imágenes de la grilla MUST ser ligeras (versión miniatura, del orden de cientos de KB como máximo en total por pantalla visible), con espacio reservado para evitar saltos y con carga diferida de las que quedan fuera de la primera pantalla; el detalle MUST usar la versión grande para la foto principal.
- **FR-031**: Las pantallas públicas MUST obtener al menos 90 puntos en Lighthouse móvil (rendimiento, accesibilidad y buenas prácticas).
- **FR-032**: Las pantallas públicas MUST NOT exponer ningún dato interno: ni identificadores internos innecesarios, ni fecha de retiro, ni las fotos originales, ni metadatos de las fotos; las rutas del panel (`/admin`) y sus funciones MUST seguir protegidas como hasta ahora.
- **FR-033**: La solución MUST seguir dentro del plan gratuito de los servicios usados (principio I) y MUST medirse el tiempo de procesamiento por solicitud en producción para confirmar que cabe en ese plan con visitas públicas, como se hizo en 003 y 004.
- **FR-034**: Las pruebas automatizadas MUST cubrir la lógica de negocio nueva: listar solo activos y en orden, filtrar por categoría, categoría desconocida, armado del enlace y del mensaje de WhatsApp (normalización del número y codificación), detalle de retirado o inexistente, y estado vacío y de error.

### Key Entities *(include if feature involves data)*

- **Trabajo**: pieza de repostería publicada (foto en tres tamaños, categoría, título, descripción opcional, fecha de creación, estado activo o retirado). El catálogo muestra solo los activos; no se agregan datos nuevos al trabajo.
- **Categoría**: agrupación fija (Tortas, Postres, Rollos, Otros) usada como filtro del catálogo y como etiqueta en la tarjeta y el detalle.
- **Contacto del negocio**: número de WhatsApp y mensajes prellenados; un conjunto único de valores de configuración que se muestra en el pie y alimenta los enlaces de WhatsApp. No lo edita la administradora desde el panel en esta fase.
- **Visitante**: persona sin sesión que abre el enlace compartido; solo puede ver el catálogo y los detalles y contactar por WhatsApp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona que abre el enlace en un celular ve los trabajos publicados y la primera pantalla utilizable en menos de 3 segundos con datos celulares típicos (conexión 4G).
- **SC-002**: Desde que abre el enlace, una persona llega a escribirle a la repostería por WhatsApp en no más de 3 toques (tocar un trabajo, "Preguntar por WhatsApp", enviar el mensaje ya escrito), y con 1 toque desde el pie del catálogo.
- **SC-003**: El 100 % de los botones de WhatsApp (detalle y pie) abren una conversación con el número configurado y un mensaje legible, verificado en un celular real con la aplicación instalada y en un computador.
- **SC-004**: Cambiar el número de WhatsApp (de prueba a real) toca un solo lugar de configuración y toma menos de 5 minutos, sin modificar ninguna pantalla.
- **SC-005**: Un trabajo publicado, editado o retirado desde el panel se refleja en el catálogo público en menos de 1 minuto, el 100 % de las veces, sin intervención manual.
- **SC-006**: Tras retirar un trabajo, el 100 % de los accesos posteriores a su detalle muestran "no disponible" y su información no se filtra en ninguna vista pública ni vista previa.
- **SC-007**: Tras reemplazar una foto, el 100 % de las vistas públicas muestran la nueva, nunca la anterior, sin limpiar el navegador.
- **SC-008**: Las páginas de catálogo y de detalle obtienen al menos 90 puntos en Lighthouse móvil, con contraste 4.5:1, texto alternativo en todas las fotos y navegación por teclado verificados.
- **SC-009**: No hay desplazamiento horizontal de la página en pantallas de 320 px de ancho en adelante, ni en celular, tableta o escritorio.
- **SC-010**: Con 100 trabajos publicados el catálogo mantiene el mismo peso inicial por página que con 12 (el peso no crece con la cantidad de trabajos).
- **SC-011**: Al pegar el enlace principal y el de un trabajo en WhatsApp, la vista previa muestra título, descripción e imagen correctos en el 100 % de las pruebas.
- **SC-012**: En una primera prueba con una persona ajena al proyecto, encuentra un trabajo por categoría y llega al botón de WhatsApp sin ayuda ni explicaciones.
- **SC-013**: El tiempo de procesamiento por solicitud medido en producción con visitas al catálogo, al detalle y a las fotos se mantiene dentro del plan gratuito, con la medición registrada como en 003 y 004.

## Assumptions

- **Número de WhatsApp de prueba**: el del desarrollador durante las pruebas y, desde el 2026-10-28, el de la administradora. Se mantiene como valor de configuración, sin que quede fijo dentro de las pantallas, para cambiarlo luego por el de la administradora.
- Esta funcionalidad se apoya en lo ya construido: trabajos con foto en tres tamaños y su servicio público de fotos (003), edición y retiro lógico (004) y el panel protegido por sesión (002). No agrega datos nuevos a los trabajos.
- **Pie reducido**: por decisión del negocio, el pie solo lleva el contacto por WhatsApp y la leyenda "Cotiza por WhatsApp"; zona de atención, anticipación y teléfono aparte quedan fuera (el mockup los traía como datos ficticios). Si luego se quieren, se agregan en la configuración central. Editar el contacto desde el panel queda fuera de alcance.
- **Sin botón flotante**: por decisión del negocio, el catálogo no lleva botón flotante; el mockup 1 lo traía y se omite a propósito.
- **Frase prellenada**: las frases de WhatsApp de FR-017 y FR-018 son la propuesta inicial; se ajustan en la configuración central sin tocar pantallas.
- **Categorías sin trabajos** se siguen mostrando en la fila (como en el mockup y las cuatro categorías fijas) con un mensaje al elegirlas, en lugar de ocultarse; así la fila no cambia de forma al publicar el primer trabajo de una categoría.
- **Paginación**: el catálogo carga de 24 en 24 trabajos, y ofrece "Ver más" para continuar; el valor exacto es ajustable en el plan. Con la cantidad esperada al inicio (decenas de trabajos) casi siempre se verá todo de una vez.
- **Frescura**: se acepta un retraso de hasta unos 60 segundos entre un cambio en el panel y su reflejo público, si el plan decide guardar copias temporales para ahorrar procesamiento; nunca más, y las fotos reemplazadas usan direcciones nuevas, por lo que nunca se ven las antiguas.
- **Posición al volver** (HU-02): se logra con que el catálogo sea una página real con su dirección y filtro, y que el navegador restaure la posición al volver; no se exige memoria propia de la posición.
- **Imagen de vista previa de la página principal**: se usa una imagen de marca (el logo); usar la foto del último trabajo queda fuera de alcance. En el detalle se usa la foto del propio trabajo. Instagram y WhatsApp pueden tardar en refrescar vistas previas ya guardadas; eso no depende del sitio.
- **Idioma y moneda**: toda la interfaz en español; sin precios. El mensaje prellenado de WhatsApp va en español.
- **Pie del detalle**: el detalle sigue el mockup 2 (sin pie extenso); el contacto completo vive en el catálogo. El detalle ofrece el botón de WhatsApp propio y "← Volver".
- Hay una sola administradora; no se requiere sesión ni registro para visitantes y no se recopilan datos personales de los visitantes (sin cuentas, formularios ni analítica nueva).
- Debe respetarse el costo $0 recurrente (principio I), la validación en celular real (principio II), no exponer metadatos ni datos internos (principio III), solo el alcance de Fase 1 (principio IV) y pruebas automatizadas de la lógica nueva (principio V).
- **Verificación de cierre**: como en 003 y 004, el cierre de esta spec incluye prueba en celular real (catálogo, detalle y WhatsApp), Lighthouse móvil ≥90 y medición de CPU en producción; esta spec cierra los hitos 4 y 5 del PRD.
- Fuera de alcance: gestión de categorías (HU-11), destacar y ordenar trabajos (HU-12), instalación como app (HU-16), precios, carrito y pagos, edición de los datos de contacto desde el panel, buscador de texto, favoritos, compartir desde un botón dentro de la página, analítica de visitas y vista previa personalizada con la foto del último trabajo en la página principal.
