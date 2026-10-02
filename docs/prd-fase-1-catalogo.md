# PRD: Fase 1 (MVP 1)
## Catálogo informativo público y panel de carga

- **Versión:** 0.1 (borrador para revisión)
- **Fecha:** 2026-10-01
- **Autor:** Juan
- **Documento base:** Documento de contexto y objetivos v0.2

---

## 1. Objetivo

Entregar un catálogo web público, informativo y agradable, donde se vean organizados los trabajos de repostería, y un panel privado muy simple con el que la administradora pueda publicarlos desde su celular. Todo con costo recurrente de $0 para el negocio.

### Definición de "funcional" para este MVP

El MVP está terminado cuando se cumplen estas cuatro condiciones a la vez:

1. La administradora entra al panel, sube un trabajo con foto y categoría, y queda publicado.
2. Cualquier persona abre el enlace público desde su celular y ve el catálogo por categorías.
3. El visitante puede contactar por WhatsApp con un toque.
4. Todo está desplegado y funcionando en internet.

## 2. Alcance

### Dentro de alcance
- Catálogo público por categorías, con detalle de cada trabajo.
- Botón de WhatsApp y datos de contacto.
- Panel privado con inicio de sesión: crear, editar y retirar trabajos y categorías.
- Subida de fotos ya editadas, con optimización automática.
- Diseño responsive, con prioridad en celular.
- Despliegue y CI básico.

### Fuera de alcance
- Precios fijos, carrito, pagos o pedidos en línea.
- Edición automática de fotos y fondo blanco.
- Inventario, finanzas, costos y recetas (fases 2a y 2b).
- Bot de WhatsApp.

## 3. Usuarios

| Rol | Descripción |
|---|---|
| Administradora | Persona que elabora los productos. Usa el panel casi siempre desde el celular. |
| Visitante | Cliente potencial que llega por un enlace compartido. Probablemente usa el celular. |

## 4. Historias de usuario

Prioridad: **Must** (imprescindible para el MVP), **Should** (importante, pero el MVP funciona sin ella), **Could** (si sobra tiempo).

### Épica 1: Catálogo público

**HU-01. Ver el catálogo por categorías** · Must
Como visitante, quiero ver los trabajos organizados por categorías para encontrar fácilmente lo que me interesa.
- Dado que entro al sitio, cuando carga la página principal, entonces veo las categorías y los trabajos publicados.
- Dado que elijo una categoría, entonces solo veo los trabajos de esa categoría.
- Dado que no hay trabajos en una categoría, entonces esa categoría no se muestra o aparece un mensaje claro.
- La vista se adapta bien a una pantalla de celular sin desplazamiento horizontal.

**HU-02. Ver el detalle de un trabajo** · Must
Como visitante, quiero ampliar un trabajo para verlo en mayor tamaño y leer su descripción.
- Dado que toco un trabajo, entonces veo la foto grande, su título y su descripción si la tiene.
- Puedo volver al catálogo sin perder mi posición en la lista.

**HU-03. Contactar por WhatsApp** · Must
Como visitante, quiero escribir por WhatsApp en un toque para preguntar por un producto.
- Hay un botón de WhatsApp visible en el catálogo en general.
- En el detalle de un trabajo, el botón abre una conversación con un mensaje prellenado que menciona ese trabajo.
- No se muestran precios; el texto indica que se cotiza por WhatsApp o llamada.

**HU-04. Compartir el enlace con una buena vista previa** · Should
Como administradora, quiero que al pegar el enlace en WhatsApp o Instagram se vea un título y una imagen atractivos.
- Al compartir el enlace principal se muestra el nombre del negocio y una imagen representativa.

**HU-05. Información del negocio** · Should
Como visitante, quiero saber cómo hacer un pedido y qué debo tener en cuenta.
- Hay una sección con datos de contacto, la anticipación sugerida para pedir y la zona de atención.
- La administradora puede cambiar ese texto sin pedir ayuda a nadie (puede resolverse como contenido editable o, en una primera versión, como texto fijo).

### Épica 2: Panel de administración

**HU-06. Iniciar sesión** · Must
Como administradora, quiero entrar al panel de forma segura para que nadie más pueda modificar el catálogo.
- Sin sesión iniciada, cualquier ruta del panel redirige al inicio de sesión.
- Con credenciales incorrectas se muestra un mensaje claro sin revelar cuál dato falló.
- La sesión se mantiene en su celular para que no tenga que entrar cada vez.
- Puedo cerrar sesión.

**HU-07. Crear un trabajo** · Must
Como administradora, quiero subir un trabajo con su foto y categoría en pocos pasos.
- El formulario pide foto y categoría como obligatorios; título y descripción son opcionales.
- Puedo elegir la foto desde la galería o tomarla con la cámara del celular.
- Al guardar, el trabajo aparece en el catálogo público.
- Si falta un campo obligatorio, el mensaje de error es claro.
- Crear un trabajo completo toma menos de un minuto.

**HU-08. Optimización automática de la foto** · Must
Como administradora, quiero subir mi foto ya editada sin preocuparme por el tamaño ni el formato.
- Se aceptan formatos de imagen comunes y se rechaza cualquier otro tipo de archivo con un mensaje claro.
- Hay un límite de tamaño razonable, con un aviso comprensible si se supera.
- La foto se corrige de orientación y se genera en varios tamaños (miniatura, mediano, grande) en un formato eficiente para web.
- Se eliminan los metadatos de la imagen, en especial la ubicación.
- La foto optimizada se ve bien en el catálogo y carga rápido en celular.

**HU-09. Editar un trabajo** · Must
Como administradora, quiero corregir la categoría, el título o la descripción de un trabajo publicado.
- Puedo modificar los campos y los cambios se reflejan en el catálogo público.
- Puedo reemplazar la foto.

**HU-10. Retirar un trabajo** · Must
Como administradora, quiero quitar un trabajo del catálogo.
- Antes de retirarlo se pide confirmación.
- Una vez retirado, deja de verse en el catálogo público.

**HU-11. Gestionar categorías** · Should
Como administradora, quiero crear y renombrar categorías (tortas, postres, rollos, etc.).
- Puedo crear, renombrar y ocultar una categoría.
- Una categoría con trabajos no se elimina sin avisar qué pasará con ellos.
- Para el MVP pueden existir categorías iniciales ya cargadas.

**HU-12. Destacar y ordenar trabajos** · Could
Como administradora, quiero elegir qué trabajos aparecen primero.
- Puedo marcar trabajos como destacados y se muestran antes que los demás.

### Épica 3: Transversal

**HU-13. Experiencia móvil primero** · Must
Como usuario, quiero que todo se vea y funcione bien en el celular.
- El catálogo y el panel se pueden usar completos desde una pantalla de celular.
- Los botones y campos tienen un tamaño cómodo para tocar.
- También se ve bien en tabletas y computadores.

**HU-14. Despliegue y CI** · Must
Como desarrollador, quiero que cada cambio se valide y se publique de forma controlada.
- Hay una canalización de CI que ejecuta las pruebas y revisiones definidas en cada cambio.
- El sitio se despliega a un entorno público accesible desde internet.
- El README explica cómo correr el proyecto y cómo se despliega.

**HU-15. Estados vacíos y errores amables** · Should
Como usuario, quiero mensajes claros cuando algo no carga o no hay contenido.
- Si no hay trabajos publicados, el catálogo muestra un mensaje en lugar de una pantalla en blanco.
- Los errores se muestran con un lenguaje sencillo.

**HU-16. Instalable en el celular (PWA)** · Could
Como administradora, quiero abrir el panel como una app desde mi pantalla de inicio.
- El panel puede agregarse a la pantalla de inicio del celular y se abre sin la barra del navegador.

## 5. Requisitos no funcionales

Las metas numéricas son propuestas para ajustar.

- **Rendimiento:** carga rápida en móvil con datos celulares. Meta propuesta: puntuación de rendimiento de 90 o más en Lighthouse móvil, e imágenes de la grilla ligeras (referencia: cientos de KB como máximo).
- **Accesibilidad básica:** contraste suficiente, texto alternativo en las imágenes y navegación con teclado en el panel.
- **Seguridad:** rutas del panel protegidas, validación del tipo y tamaño de los archivos en el servidor, sin exponer metadatos de las fotos.
- **Costo:** $0 recurrente para el negocio (dominio propio opcional).
- **Mantenibilidad:** código organizado, README y registros de decisiones al día.

## 6. Definición de terminado (por historia)

Una historia se considera terminada cuando:

1. Cumple todos sus criterios de aceptación.
2. Se probó en un celular real, no solo en el navegador de escritorio.
3. Está desplegada y funcionando.
4. Tiene las pruebas acordadas y pasa el CI.
5. El README o el registro de decisiones se actualizó si hubo cambios relevantes.

## 7. Orden sugerido de construcción

Primero un "esqueleto que camina", es decir, algo mínimo pero desplegado de punta a punta, y luego se va engordando:

1. **Hito 1:** proyecto base, página de inicio mínima, CI y despliegue funcionando (HU-14).
2. **Hito 2:** modelo de datos e inicio de sesión (HU-06).
3. **Hito 3:** crear un trabajo con foto optimizada (HU-07, HU-08).
4. **Hito 4:** catálogo público por categorías y detalle (HU-01, HU-02, HU-13).
5. **Hito 5:** WhatsApp, editar y retirar (HU-03, HU-09, HU-10).
6. **Hito 6:** pulido, estados vacíos y prueba con la administradora real (HU-15, y las Should y Could que quepan).

## 8. Preguntas abiertas

- Nombre del negocio, logo y colores.
- Número de WhatsApp y datos de contacto a mostrar.
- Categorías iniciales.
- ¿Habrá un solo usuario administrador o más de uno?
- ¿La descripción será opcional o recomendada?
- Formatos de foto reales que produce el celular de la administradora (por ejemplo, si usa HEIC).
- Cantidad aproximada de trabajos que se cargarán al inicio.

## 9. Siguiente entregable

Arquitectura y registros de decisiones (ADRs): stack, base de datos, almacenamiento de imágenes, dónde se optimizan las fotos, autenticación y hosting a costo cero.
