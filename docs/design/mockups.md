# Mockups — Catálogo y Panel

Mockups interactivos de la Fase 1, diseñados móvil primero (390×844) a partir del logo.

- **Archivo**: [design/mockups.html](design/mockups.html) (HTML + CSS autocontenido; abrir en el navegador y navegar con los botones superiores)
- **Logo**: [design/SamuelE.jpg](design/SamuelE.jpg) (se usa tal cual, recortado en círculo con CSS para quitar el fondo gris)
- **Referencias visuales aprobadas** (hechas con Claude Design, el HTML las replica):
  - [design/4 · Inicio de sesión.png](design/4%20·%20Inicio%20de%20sesión.png)
  - [design/5 · Panel lista + confirmar.png](design/5%20·%20Panel%20lista%20+%20confirmar.png)

## Pantallas

| # | Pantalla | Viewport | Contenido |
|---|---|---|---|
| 1 | Catálogo público | Móvil | Cabecera con logo, chips de categorías con scroll horizontal (Todos, Tortas, Postres, Rollos, Otros), grilla de 2 columnas, botón flotante de WhatsApp, pie con contacto, zona de atención y anticipación, texto "Cotiza por WhatsApp o llamada" (sin precios) |
| 2 | Detalle de un trabajo | Móvil | Foto grande, categoría, título, descripción, botón "Preguntar por WhatsApp", regreso al catálogo |
| 3 | Inicio de sesión | Móvil | Logo grande, "Panel de trabajos", correo, contraseña, error genérico "Correo o contraseña incorrectos.", botón "Ingresar". Replica la referencia 4 |
| 4 | Panel: lista de trabajos | Móvil | Logo pequeño, "Mis trabajos", "Salir", botón "+ Nuevo trabajo", tarjetas con miniatura, categoría, Editar y Retirar, y diálogo "¿Retirar este trabajo?" con Cancelar/Retirar. Replica la referencia 5 |
| 5 | Panel: nuevo/editar trabajo | Móvil | Foto (galería o cámara) y categoría obligatorias; título y descripción opcionales; un solo botón "Publicar" |
| 6 | Catálogo responsive | Tableta/escritorio | Cabecera horizontal con logo y lema, chips, grilla de 3 columnas, pie |

## Branding

- **Nombre**: Samuelé Repostería
- **Lema**: "Creamos momentos dulces"
- **Colores**:

| Uso | Hex |
|---|---|
| Texto y títulos (chocolate) | `#3B1F14` |
| Acento (rosa) | `#E85A9A` |
| Botones principales (rosa oscuro, cumple contraste con texto blanco) | `#B8326E` |
| Acciones destructivas y errores (rojo) | `#A8142F` |
| Detalles y líneas finas (dorado) | `#C9A24B` |
| Fondo (crema) | `#FFF8F1` |

- **Tipografía**:
  - Títulos y nombre: script (`Dancing Script`, con respaldo `Brush Script MT`, cursive).
  - Resto: sans del sistema (`Segoe UI`, Tahoma, Geneva, Verdana, sans-serif).
  - Texto del cuerpo ≥16 px.
- **Tono**: dulce, cálido, artesanal, sin verse infantil; mucho aire y fotos grandes.

## Reglas de diseño aplicadas

- Contraste mínimo 4.5:1 en todo texto (por eso los botones usan `#B8326E` y no `#E85A9A` con texto blanco).
- Botones y campos táctiles de al menos 44 px de alto (48 px en login y panel).
- Sin carrito, pagos ni precios fijos.
- Logo en las imágenes por defecto (catálogo, detalle, login, cabecera del panel y versión de escritorio). Las miniaturas del panel son bloques de color liso, como en la referencia 5.

## Pendiente

- **Estado vacío del catálogo** (HU-15): pedido en el brief, aún no está en el mockup.
- **Estados de error y de carga de foto** en "Nuevo/editar trabajo": pedidos, aún no están.
- **Versión tableta/escritorio del panel**: solo existe la del catálogo.
- **Fuente script**: `Dancing Script` no se carga desde ningún proveedor; sin ella el navegador usa `Brush Script MT` o la cursiva del sistema. Definir en un ADR cómo se servirá la fuente (autoalojada, para mantener costo cero).
- **Datos de ejemplo**: teléfono, zona y anticipación del pie son ficticios (preguntas abiertas del PRD).
- **Verificación visual**: el HTML no se ha revisado aún en un navegador ni en un celular real (exigido por la definición de terminado).
