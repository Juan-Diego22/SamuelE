/**
 * Datos de contacto del negocio: único lugar a editar para cambiar el número de
 * WhatsApp o las frases (SC-004). No son secretos, por eso se versionan.
 */
export const SITE = {
  name: "Samuelé Repostería",
  tagline: "Creamos momentos dulces",
  /** Número de prueba; se cambia por el de la administradora tras las pruebas. */
  whatsapp: "+57 316 544 1337",
  footerNote: "Cotiza por WhatsApp",
  messages: {
    general: "Hola Samuelé, vi su catálogo y quiero más información.",
    /** `{title}` se sustituye por el título del trabajo (o su categoría). */
    work: 'Hola Samuelé, me interesa el trabajo "{title}". ¿Me puedes dar más información?',
  },
} as const;
