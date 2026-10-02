# Documento de contexto y objetivos
## Catálogo y gestión para un emprendimiento de repostería casera

- **Versión:** 0.2 (borrador para revisión; agrega la restricción de costo $0)
- **Fecha:** 2026-10-01
- **Autor:** Juan
- **Estado:** Discovery completado; pendiente de revisión antes de pasar al PRD

---

## 1. Resumen

Un emprendimiento familiar de repostería casera (tortas, rollos, postres y otros productos) hoy muestra su trabajo únicamente en Instagram y lleva sus costos de forma manual. Este proyecto construye una aplicación web, usada por la persona que hace los productos, con dos objetivos:

1. Una **vitrina pública y profesional** donde los trabajos realizados estén organizados por categorías.
2. A futuro, un **panel privado** para controlar inventario de insumos, gastos, ingresos y ganancias.

El proyecto tiene además un objetivo propio de quien lo desarrolla: practicar un ciclo de desarrollo profesional completo y dejar un proyecto de portafolio en uso real.

## 2. Contexto

- El negocio opera desde casa. La administradora principal del contenido es la persona que elabora los productos y conoce todo el negocio.
- **Instagram** es su carta de presentación: allí están los productos que han vendido.
- Los clientes llegan por **llamada o WhatsApp** preguntando por productos o precios. Algunos productos se ofrecen en persona como encargo.
- Los **precios varían** según cada pedido, por lo que no se publican precios fijos.
- Las fotos se **editan fuera del sistema** (la administradora las mejora con una herramienta externa) antes de publicarse.
- Los costos y ganancias se llevan hoy en un **cuaderno y en cuentas en el celular**.
- La administradora no tiene restricciones de tiempo para alimentar el sistema, porque ella misma hace todo el trabajo.

## 3. Problema y oportunidad

- No existe un lugar propio, ordenado y fácil de compartir donde ver todo lo que han hecho. Instagram no categoriza ni permite explorar por tipo de producto u ocasión.
- No hay una visión consolidada de gastos frente a ganancias ni del valor de lo que tienen en inventario.
- **Matiz importante:** el negocio no sufre un problema crítico hoy; los pedidos funcionan. La oportunidad es de mejora y profesionalización, no de urgencia. Esto hace que el principal riesgo sea la **adopción**, no la funcionalidad.

## 4. Usuarios

| Usuario | Descripción | Necesidades clave |
|---|---|---|
| Administradora | Persona que elabora los productos y gestiona el catálogo. Uso casi siempre desde el celular. | Subir un trabajo rápido, categorizarlo, editarlo o retirarlo. |
| Visitante / cliente potencial | Llega por un enlace compartido (Instagram, WhatsApp). Probablemente desde el celular. | Ver los trabajos organizados, tener una buena experiencia visual y contactar fácilmente. |
| Desarrollador (Juan) | Construye y mantiene el sistema. | Proyecto bien documentado y con decisiones justificadas. |

## 5. Objetivos

### Del negocio
- Ofrecer una vitrina profesional, agradable y ordenada de los trabajos realizados.
- Facilitar que la administradora publique nuevos trabajos con poco esfuerzo.
- (Fase 2) Dar visibilidad de inventario, gastos, ingresos y ganancias.

### Del proyecto (portafolio)
- Aplicar un ciclo profesional: discovery, requerimientos, arquitectura, implementación, pruebas, CI y despliegue.
- Tener un producto en uso real, con documentación y decisiones registradas.

## 6. Alcance por fases

### Fase 1: MVP 1 (alcance de este ciclo)
- Catálogo público organizado por categorías (ej. tortas, postres, rollos).
- Diseño responsive, con prioridad en celular.
- Botón de WhatsApp y datos de contacto siempre visibles. Sin precios fijos.
- Panel privado con inicio de sesión para la administradora, pensado primero para celular.
- Crear, editar y retirar trabajos (foto, categoría y descripción básica).
- Soporte de fotos **ya editadas** por la administradora, con procesamiento de optimización: validación del archivo, corrección de orientación, versiones en varios tamaños, formato web eficiente, eliminación de metadatos (incluida la ubicación GPS) y conservación de la original.
- Despliegue y CI básico.

### Fase 2a (posterior)
- Registro de ingresos y gastos.
- Inventario de insumos con costo, usando una unidad base por ingrediente (g, ml o unidad) y ajustes manuales.
- Valor del inventario y comparativo de ganancias.

### Fase 2b (posterior)
- Recetas por producto.
- Descuento automático de insumos al producir.
- Costeo por producto.

### Fuera de alcance por ahora
- Edición automática de fotos y remoción de fondo (el módulo de imágenes se diseña de forma que pueda agregarse después).
- Pagos, carrito de compras o pedidos en línea.
- Bot de WhatsApp.

## 7. Principios de diseño

1. **Mobile-first**, evaluando una PWA para que la administradora lo tenga en su pantalla de inicio.
2. **Simplicidad para la administradora:** subir un trabajo debe requerir pocos pasos.
3. **Rendimiento:** el sitio público debe cargar rápido, especialmente en datos móviles.
4. **Privacidad:** no exponer metadatos de las fotos ni datos innecesarios.
5. **Sin precios fijos:** la cotización se hace por WhatsApp o llamada.
6. **Alcance pequeño y terminado** antes que muchas funciones a medias.

## 8. Requisitos no funcionales iniciales

- Responsive en cualquier tamaño de pantalla.
- Panel privado protegido con autenticación.
- Validación segura de archivos subidos.
- **Restricción de costo: $0 recurrente para el negocio.** El proyecto es experimental y de portafolio, y ellos deben poder usarlo sin pagar. Se usarán capas gratuitas que permitan uso comercial. El dominio propio es opcional y sería el único gasto posible.
- Mantenimiento sencillo.
- Código y decisiones documentados (README y registros de decisiones).

## 9. Supuestos (por validar)

- La administradora usará el panel desde el celular.
- Le resulta aceptable que el catálogo sea público.
- Está dispuesta a subir sus trabajos pasados y nuevos de forma constante.
- El volumen de trabajos es manejable sin paginación compleja (por confirmar).
- Los formatos de foto de su celular serán compatibles o convertibles (por confirmar, incluido HEIC si usa iPhone).

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Baja adopción porque no hay un dolor urgente. | Prototipo temprano con sus propias fotos y validación antes de construir todo. |
| Subir trabajos resulta tedioso desde el celular. | Flujo mínimo de carga y pruebas de uso reales con ella. |
| Inflar el alcance y no terminar. | MVP 1 cerrado; fases posteriores separadas. |
| Fase 2 (recetas y descuento automático) es compleja. | Dividirla en 2a y 2b y diseñar el modelo de datos con anticipación. |
| Fotos pesadas o con datos de ubicación. | Pipeline de optimización y eliminación de metadatos. |

## 11. Criterios de éxito (propuestos)

- La administradora publica trabajos nuevos por sí sola, sin ayuda.
- El catálogo se comparte como enlace (por ejemplo en la biografía de Instagram) y se usa de forma real.
- El sitio carga de forma fluida en un celular con datos móviles.
- El proyecto queda desplegado, con CI, documentación y decisiones registradas.

## 12. Decisiones pendientes (candidatas a registro de decisiones)

- Stack de frontend y backend.
- Base de datos.
- Almacenamiento de imágenes (original y derivadas).
- Hosting, base de datos y almacenamiento a costo $0 (verificar límites y términos de uso comercial de cada capa gratuita).
- Dominio propio (opcional) frente a un subdominio gratuito.
- Dónde se optimizan las imágenes: en el navegador antes de subirlas o en el servidor.
- PWA sí o no, y alcance.
- Mecanismo de autenticación.
- Formatos de imagen admitidos (HEIC) y límites de tamaño.
- Nombre del negocio y línea visual del catálogo.

## 13. Proceso de trabajo y herramientas

- Ciclo: discovery, PRD, arquitectura, backlog, implementación por historias, pruebas, CI y despliegue, feedback real.
- Especificaciones y flujo con agentes: BMAD Method o Speckit (a definir cuál, sin mezclarlos a fondo).
- Entorno: Ubuntu, con ClaudeCode.

## 14. Próximos entregables

1. Revisión de este documento y ajustes.
2. PRD de la Fase 1 con historias de usuario y criterios de aceptación.
3. Arquitectura, modelo de datos y registros de decisiones.
4. Backlog priorizado.
5. Prototipo o bocetos del catálogo y del panel de carga para validar con la administradora.

---

## Anexo: resumen del discovery

- **Flujo de fotos:** las edita con una herramienta externa; busca sobre todo mejorar el enfoque y dejar un fondo blanco que resalte el producto. Decisión: ella edita por fuera y el sistema soporta fotos ya editadas.
- **Clientes:** llegan por llamada o WhatsApp; algunos productos se ofrecen en persona como encargo.
- **Catálogo:** informativo, categorizado, público, con diseño agradable y profesional.
- **Costos y ganancias:** hoy cuaderno y cuentas en el celular. Quiere ver gastos frente a ganancias, manejar inventario, calcular su valor, descontar al producir y calcular ganancias.
- **Dispositivo:** casi siempre celular, pero debe funcionar en cualquier pantalla.
- **Tiempo:** sin restricciones, porque ella hace todo el trabajo.
