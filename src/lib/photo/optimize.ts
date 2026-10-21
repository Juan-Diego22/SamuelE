import { MESSAGES } from "../works/messages";
import { PHOTO_QUALITY } from "../works/limits";
import type { PhotoExt } from "../works/keys";
import { planDerivatives } from "./plan";

export interface OptimizedPhoto {
  sm: Blob;
  md: Blob;
  lg: Blob;
  ext: PhotoExt;
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Solo navegador. Decodifica con la orientación corregida, dibuja cada ancho en un canvas
 * y re-codifica en WebP (o JPEG si no hay soporte): al pasar por el canvas se pierde todo EXIF.
 */
export async function optimizePhoto(file: File): Promise<OptimizedPhoto> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(MESSAGES.photoFormat);
  }

  try {
    // Se prueba una vez el soporte real de WebP en este navegador.
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const supportsWebp =
      (await toBlob(probe, "image/webp", PHOTO_QUALITY))?.type === "image/webp";
    let plan = planDerivatives(bitmap.width, bitmap.height, supportsWebp);

    const render = async (ext: PhotoExt) => {
      const mime = ext === "webp" ? "image/webp" : "image/jpeg";
      const blobs = {} as Record<"sm" | "md" | "lg", Blob>;
      for (const { size, width, height } of plan.sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error(MESSAGES.derivativesInvalid);
        if (ext === "jpg") {
          // JPEG no tiene transparencia: fondo blanco para fotos PNG con alfa.
          context.fillStyle = "#fff";
          context.fillRect(0, 0, width, height);
        }
        context.drawImage(bitmap, 0, 0, width, height);
        const blob = await toBlob(canvas, mime, PHOTO_QUALITY);
        if (!blob || blob.type !== mime) return null;
        blobs[size] = blob;
      }
      return blobs;
    };

    let blobs = await render(plan.ext);
    if (!blobs && plan.ext === "webp") {
      plan = { ...plan, ext: "jpg" };
      blobs = await render("jpg");
    }
    if (!blobs) throw new Error(MESSAGES.derivativesInvalid);
    return { ...blobs, ext: plan.ext };
  } finally {
    bitmap.close();
  }
}
