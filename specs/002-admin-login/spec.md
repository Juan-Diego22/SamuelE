# Feature Specification: Inicio de sesión de la administradora

**Feature Branch**: `feature/002-admin-login`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Funcionalidad 002: modelo de datos e inicio de sesión de la administradora (Hito 2 del PRD, HU-06). Como administradora, quiero entrar al panel de forma segura para que nadie más pueda modificar el catálogo. Criterios de HU-06: sin sesión iniciada, cualquier ruta del panel redirige al inicio de sesión; con credenciales incorrectas se muestra un mensaje claro sin revelar cuál dato falló; la sesión se mantiene en su celular para que no tenga que entrar cada vez; puedo cerrar sesión. Incluye la base de datos mínima necesaria para sesiones e intentos de acceso (ver ADR 0003 y ADR 0006). La pantalla de inicio de sesión sigue los mockups en docs/design. Debe respetar el límite de 10 ms de CPU del plan gratuito de Workers y el costo $0 recurrente. Fuera de alcance: crear, editar o retirar trabajos, subida de fotos y catálogo público (hitos posteriores)."

**Referencias**: `docs/prd-fase-1.md` (sección 7 Hito 2; HU-06), `.specify/memory/constitution.md` (principios II, III, V), `docs/adr/0003-base-de-datos.md`, `docs/adr/0006-autenticacion.md`, `docs/design/mockups.md` (pantalla 3) y `docs/design/4 · Inicio de sesión.png`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar al panel con correo y contraseña (Priority: P1)

La administradora abre la pantalla de inicio de sesión desde su celular, escribe su correo y su contraseña, y entra al panel. Si algún dato es incorrecto, ve un mensaje claro que no revela cuál de los dos falló.

**Why this priority**: Es el núcleo de HU-06 y la puerta de todo el panel. Sin ella, ninguna historia posterior (crear, editar o retirar trabajos) puede protegerse.

**Independent Test**: Abrir la pantalla de inicio de sesión en un celular real, entrar con las credenciales correctas y llegar al panel; repetir con un correo incorrecto y con una contraseña incorrecta y comprobar que el mensaje es idéntico.

**Acceptance Scenarios**:

1. **Given** la pantalla de inicio de sesión, **When** la administradora escribe su correo y contraseña correctos y pulsa "Ingresar", **Then** entra al panel.
2. **Given** la pantalla de inicio de sesión, **When** escribe un correo incorrecto con cualquier contraseña, **Then** ve el mensaje "Correo o contraseña incorrectos." y permanece en la pantalla.
3. **Given** la pantalla de inicio de sesión, **When** escribe el correo correcto con una contraseña incorrecta, **Then** ve exactamente el mismo mensaje y la misma pantalla que en el escenario 2, de modo que no se puede deducir cuál dato falló.
4. **Given** la pantalla de inicio de sesión, **When** deja el correo o la contraseña vacíos y pulsa "Ingresar", **Then** se le indica que complete ambos campos, sin consultar las credenciales.
5. **Given** la pantalla abierta en un celular, **When** la administradora la recorre, **Then** ve el logo, el título "Panel de trabajos", los campos de correo y contraseña y el botón "Ingresar" como en el mockup, sin desplazamiento horizontal, con campos y botón de al menos 48 px de alto y contraste mínimo de 4.5:1 en todo texto.
6. **Given** un lector de pantalla o navegación solo con teclado, **When** se recorre el formulario, **Then** cada campo tiene su etiqueta y el mensaje de error se anuncia y se alcanza con el teclado.

---

### User Story 2 - Que nadie sin sesión llegue al panel (Priority: P1)

Cualquier persona que intente abrir una dirección del panel sin haber iniciado sesión es enviada a la pantalla de inicio de sesión. Las operaciones de administración que no son páginas (las que más adelante modificarán el catálogo) rechazan toda petición sin sesión.

**Why this priority**: Es la protección real: de nada sirve el formulario si el panel puede abrirse por la dirección directa. Cumple el principio III de la constitución ("verificar que el panel redirige sin autenticación").

**Independent Test**: Sin sesión, abrir directamente `/admin` y una subruta inexistente como `/admin/cualquier-cosa`, y pedir una ruta de administración de datos: las páginas redirigen al inicio de sesión y la petición de datos es rechazada.

**Acceptance Scenarios**:

1. **Given** un visitante sin sesión, **When** abre cualquier dirección bajo `/admin` (excepto la de inicio de sesión), **Then** es redirigido a `/admin/login`.
2. **Given** un visitante sin sesión, **When** hace una petición a cualquier ruta de administración de datos bajo `/api/admin`, **Then** recibe una respuesta de no autorizado y no se ejecuta ninguna acción.
3. **Given** una administradora con sesión válida, **When** abre `/admin/login`, **Then** es llevada directamente al panel sin ver el formulario.
4. **Given** una sesión vencida o cerrada, **When** se intenta abrir una página del panel, **Then** se trata como una visita sin sesión y se redirige al inicio de sesión.
5. **Given** el sitio público, **When** un visitante abre la página de inicio o cualquier otra dirección que no es del panel, **Then** el comportamiento no cambia y no se le pide sesión.

---

### User Story 3 - Mantener la sesión en el celular y poder cerrarla (Priority: P2)

Tras entrar, la administradora no tiene que volver a escribir sus datos cada vez que abre el panel desde el mismo celular durante un período largo. Cuando quiere, pulsa "Salir" y la sesión termina de inmediato.

**Why this priority**: Es la comodidad que pide HU-06 (flujo rápido desde el celular) y el control mínimo de seguridad (cerrar sesión). Puede entregarse después del login porque el login ya es útil por sí solo.

**Independent Test**: Iniciar sesión, cerrar y reabrir el navegador del celular y comprobar que se entra sin pedir datos; pulsar "Salir" y comprobar que el panel vuelve a exigir inicio de sesión, incluso usando el botón de atrás.

**Acceptance Scenarios**:

1. **Given** una sesión iniciada, **When** la administradora cierra el navegador y lo vuelve a abrir en el mismo celular dentro de los 30 días siguientes al último inicio de sesión, **Then** abre el panel sin escribir sus datos.
2. **Given** una sesión iniciada hace más de 30 días, **When** intenta abrir el panel, **Then** se le pide iniciar sesión de nuevo.
3. **Given** una sesión iniciada, **When** pulsa "Salir", **Then** la sesión termina, vuelve a la pantalla de inicio de sesión y esa sesión ya no sirve aunque se conserve una copia de ella.
4. **Given** una sesión cerrada, **When** pulsa el botón de atrás del navegador, **Then** no puede ver ni usar contenido del panel sin iniciar sesión.
5. **Given** que la administradora inicia sesión en un segundo dispositivo, **When** vuelve al primero, **Then** ambas sesiones funcionan de forma independiente y cerrar una no cierra la otra.

---

### User Story 4 - Frenar los intentos repetidos de adivinar la contraseña (Priority: P2)

Si alguien falla varias veces seguidas al iniciar sesión, el sistema deja de aceptar nuevos intentos durante un tiempo, aunque luego se escriba la contraseña correcta, y lo explica con un mensaje claro.

**Why this priority**: La contraseña es la única barrera del panel; limitar los intentos evita que se pueda adivinar por fuerza bruta. Va después de las historias que hacen funcionar el acceso.

**Independent Test**: Fallar el inicio de sesión cinco veces seguidas, intentar con la contraseña correcta y comprobar que se rechaza con el mensaje de espera; esperar 15 minutos y comprobar que vuelve a funcionar.

**Acceptance Scenarios**:

1. **Given** cuatro intentos fallidos en los últimos 15 minutos, **When** ocurre un quinto intento fallido, **Then** los intentos quedan bloqueados durante 15 minutos.
2. **Given** el bloqueo activo, **When** se envían credenciales, aunque sean correctas, **Then** se rechazan con el mensaje "Demasiados intentos. Intenta de nuevo en 15 minutos." sin comprobar si los datos son válidos.
3. **Given** el bloqueo activo, **When** pasan 15 minutos desde el bloqueo, **Then** se aceptan de nuevo los intentos y las credenciales correctas permiten entrar.
4. **Given** intentos fallidos menores al límite, **When** la administradora entra con las credenciales correctas, **Then** entra normalmente y el contador de fallos se reinicia.
5. **Given** el bloqueo activo, **When** se muestra el mensaje, **Then** el mensaje es el mismo sin importar qué dato fue el incorrecto, de modo que tampoco revela cuál falló.

---

### Edge Cases

- ¿Qué pasa si el formulario se envía dos veces seguidas (doble toque en el celular)? Se procesa una sola vez y no genera dos sesiones ni cuenta como dos fallos.
- ¿Qué pasa si el correo se escribe con mayúsculas o con espacios al inicio o al final? Se ignoran las mayúsculas y los espacios sobrantes al comparar.
- ¿Qué pasa si falta la configuración de las credenciales de la administradora (correo o contraseña) en el despliegue? Nadie puede entrar y el sitio público sigue funcionando; el panel falla de forma cerrada, nunca abierta.
- ¿Qué pasa si la base de datos no responde durante un intento de inicio de sesión? Se muestra un mensaje de error amable ("No pudimos iniciar sesión, intenta de nuevo en unos minutos") y no se concede acceso.
- ¿Qué pasa si alguien intenta una petición que modifica datos desde otro sitio web mientras la administradora tiene sesión abierta? Se rechaza.
- ¿Qué pasa si el bloqueo se activa por intentos ajenos? La administradora debe esperar 15 minutos; es un efecto aceptado (ver ADR 0006).
- ¿Qué pasa con la sesión de un dispositivo perdido? El desarrollador puede invalidar todas las sesiones a la vez al cambiar la credencial.
- ¿Qué pasa si JavaScript está desactivado en el navegador? El formulario sigue funcionando porque se envía de forma tradicional.
- ¿Qué ve quien escribe una dirección inexistente bajo `/admin`? Se aplica la regla de protección (redirige al inicio de sesión), sin revelar qué rutas existen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sitio MUST ofrecer una pantalla de inicio de sesión en `/admin/login` con correo, contraseña y el botón "Ingresar", con el aspecto del mockup 3 (`docs/design/mockups.md`): logo grande, título "Panel de trabajos", error genérico y la identidad visual del negocio.
- **FR-002**: El sistema MUST aceptar el acceso solo cuando el correo y la contraseña coinciden con los de la administradora, que son una única credencial configurada en el despliegue y no se guarda en el repositorio ni en la base de datos.
- **FR-003**: Ante credenciales incorrectas, el sistema MUST mostrar el mismo mensaje ("Correo o contraseña incorrectos.") y la misma pantalla, sin importar cuál de los dos datos falló, y sin diferencias perceptibles en la respuesta (incluido el tiempo de respuesta) que permitan deducirlo.
- **FR-004**: Una vez iniciada la sesión, el sistema MUST llevar a la administradora al panel (`/admin`).
- **FR-005**: El sistema MUST proteger toda dirección bajo `/admin` (excepto `/admin/login`): sin sesión válida, MUST redirigir a `/admin/login`, incluidas las direcciones que no existen.
- **FR-006**: El sistema MUST proteger toda ruta bajo `/api/admin`: sin sesión válida, MUST rechazar la petición como no autorizada sin ejecutar ninguna acción.
- **FR-007**: El sistema MUST mantener la sesión durante 30 días desde el inicio de sesión, en el celular de la administradora, aunque se cierre y se reabra el navegador. Al vencer, MUST exigir un nuevo inicio de sesión.
- **FR-008**: La sesión MUST poder cerrarse desde el panel con "Salir". Al cerrarla, el sistema MUST invalidarla en el servidor, de modo que no sirva aunque se conserve una copia, y MUST llevar a la pantalla de inicio de sesión.
- **FR-009**: Cada inicio de sesión MUST crear una sesión independiente; cerrar o vencer una no MUST afectar a las demás.
- **FR-010**: El sistema MUST limitar los intentos fallidos: tras 5 fallos en 15 minutos, MUST rechazar todo intento (incluso con credenciales correctas) durante 15 minutos con el mensaje "Demasiados intentos. Intenta de nuevo en 15 minutos."
- **FR-011**: Un inicio de sesión correcto fuera del bloqueo MUST reiniciar el conteo de fallos.
- **FR-012**: El sistema MUST rechazar toda petición que modifica datos si no proviene del propio sitio.
- **FR-013**: El identificador de sesión MUST ser imposible de adivinar, MUST guardarse en el navegador de forma que no lo pueda leer ningún script de la página y solo viaje por conexión segura, y en el servidor MUST guardarse solo una versión irreversible de él, no el valor original.
- **FR-014**: El panel MUST mostrar, tras iniciar sesión, una pantalla mínima con el título "Panel de trabajos" y el botón "Salir". El contenido real del panel (lista de trabajos) queda para el Hito 5 del PRD.
- **FR-015**: Los campos y el botón MUST medir al menos 48 px de alto, todo texto MUST tener contraste mínimo de 4.5:1, cada campo MUST tener etiqueta asociada y el formulario MUST poder usarse solo con teclado (constitución, principio II).
- **FR-016**: El formulario MUST funcionar sin JavaScript (envío tradicional de formulario).
- **FR-017**: El sistema MUST guardar de forma persistente solo lo necesario: las sesiones activas (con su vencimiento) y los intentos fallidos recientes. No MUST haber tabla de usuarios ni almacenar contraseñas.
- **FR-018**: El sistema MUST borrar de forma periódica o al consultarlos las sesiones vencidas y los intentos fallidos más antiguos que la ventana de 15 minutos, para no acumular datos indefinidamente.
- **FR-019**: Cada petición de inicio de sesión y de verificación de sesión MUST caber en el límite de CPU del plan gratuito de Workers (10 ms por petición), y toda la funcionalidad MUST operar sin costo recurrente (constitución, principio I). Esto se comprueba con las pruebas de la historia 1 y la medición posterior.
- **FR-020**: El sistema MUST incluir pruebas automatizadas que cubran: inicio de sesión correcto, mensaje genérico idéntico para correo y contraseña incorrectos, bloqueo tras 5 fallos y recuperación tras 15 minutos, vencimiento de sesión, cierre de sesión, y redirección sin sesión de páginas y rechazo de rutas de datos (constitución, principio V; ADR 0006).
- **FR-021**: El sitio público (página de inicio y 404) MUST seguir funcionando igual, sin pedir sesión ni verse afectado.
- **FR-022**: El registro de decisiones MUST quedar actualizado: el ADR 0006 refleja lo implementado y la documentación (`README.md`) explica cómo configurar las credenciales de la administradora y cómo invalidar las sesiones.

### Key Entities *(include if feature involves data)*

- **Sesión**: representa un inicio de sesión activo de la administradora en un dispositivo. Atributos: identificador irreversible (no el valor entregado al navegador), fecha de creación y fecha de vencimiento (30 días).
- **Intento fallido de acceso**: registro de un inicio de sesión rechazado. Atributos: momento del intento. Se usa para decidir el bloqueo y se descarta pasada la ventana de 15 minutos. El bloqueo es global, no por persona ni por dirección.
- **Credencial de la administradora**: único correo y contraseña válidos. No es una entidad guardada en la base: se configura como secreto del despliegue (ver Assumptions).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La administradora puede iniciar sesión desde su celular en menos de 20 segundos desde que abre la pantalla, a la primera, con las credenciales correctas.
- **SC-002**: El 100 % de las direcciones de página bajo `/admin` (existan o no) redirigen al inicio de sesión sin sesión válida, y el 100 % de las rutas de datos de administración rechazan la petición, comprobado con pruebas automatizadas.
- **SC-003**: Con un correo incorrecto y con una contraseña incorrecta, la respuesta que ve el usuario es idéntica (mismo texto y misma pantalla) en el 100 % de los casos probados.
- **SC-004**: Tras 5 intentos fallidos en 15 minutos, el 100 % de los intentos siguientes se rechazan durante 15 minutos, y el primero después de ese plazo con credenciales correctas entra.
- **SC-005**: Una sesión iniciada sigue válida al reabrir el navegador del celular durante 30 días, y deja de servir de inmediato al cerrarla con "Salir".
- **SC-006**: La pantalla de inicio de sesión no tiene desplazamiento horizontal desde 320 px de ancho, mantiene contraste ≥4.5:1, y logra puntuación ≥90 de rendimiento y de accesibilidad en Lighthouse móvil.
- **SC-007**: La pantalla se prueba en un celular real y queda registrado en el pull request, con modelo, navegador y fecha (definición de terminado).
- **SC-008**: Las páginas públicas del sitio (inicio y 404) mantienen sus puntuaciones de la funcionalidad 001 (≥90) y siguen respondiendo como antes.
- **SC-009**: Al medir el CPU del Worker tras el despliegue, el inicio de sesión y la verificación de sesión no superan el límite de 10 ms por petición del plan gratuito, y el costo recurrente se mantiene en $0.
- **SC-010**: Cualquier persona con acceso al repositorio puede configurar las credenciales y desplegar siguiendo solo el README, sin pasos no documentados.

## Assumptions

- Hay una sola administradora; no se prevén más usuarios en la Fase 1 (ADR 0006). Por eso no existe registro de usuarios, recuperación de contraseña ni cambio de contraseña desde el panel.
- El correo y la contraseña de la administradora son secretos del despliegue (`ADMIN_EMAIL` y `ADMIN_PASSWORD`, ADR 0006). La contraseña la genera el desarrollador de forma aleatoria (al menos 20 caracteres) y se entrega a la administradora para guardarla en el gestor de contraseñas de su celular.
- Cambiar o recuperar la credencial es una tarea del desarrollador: actualiza el secreto y borra las sesiones. Se acepta para la Fase 1.
- El bloqueo por intentos fallidos es global (no por persona ni por dirección IP). Alguien podría provocarlo a propósito; se acepta por el bajo riesgo del sitio (ADR 0006).
- No hay segundo factor de autenticación; se reevalúa si el panel llega a manejar datos sensibles (fase 2a).
- El panel de esta funcionalidad es solo un marcador mínimo (título y "Salir"); la lista y la gestión de trabajos llegan con los hitos 3 y 5.
- Los textos de la interfaz están en español, con los mensajes exactos del mockup: "Panel de trabajos", "Correo o contraseña incorrectos." y botón "Ingresar".
- La administradora usa un navegador reciente en su celular; el sitio público sigue siendo compatible con navegadores antiguos como en la funcionalidad 001, pero el panel solo se garantiza en navegadores actuales.
- Depende de la infraestructura entregada por la funcionalidad 001 (despliegue automático, CI y protección de `main`) y de una base de datos gratuita de Cloudflare (ADR 0003), cuyos límites diarios sobran para el uso previsto.
- Fuera de alcance: crear, editar y retirar trabajos, categorías, subida y optimización de fotos, catálogo público, WhatsApp y cualquier gestión de usuarios.
