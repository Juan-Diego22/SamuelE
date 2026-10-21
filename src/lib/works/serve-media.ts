import type { MediaStore } from "./store";

const PUBLIC_KEY =
  /^works\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d+\/(?:sm|md|lg)\.(webp|jpg)$/i;

const CONTENT_TYPES = { webp: "image/webp", jpg: "image/jpeg" } as const;

/** `GET /media/{path}`: solo sirve derivadas con la forma exacta; `originals/` y lo demás es 404 sin tocar R2. */
export async function serveMedia(
  method: string,
  path: string | undefined,
  mediaStore: MediaStore,
): Promise<Response> {
  if (method !== "GET" && method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const match = path ? PUBLIC_KEY.exec(path) : null;
  if (!path || !match) return new Response(null, { status: 404 });

  let file;
  try {
    file = await mediaStore.get(path);
  } catch {
    return new Response(null, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!file) return new Response(null, { status: 404 });

  const ext = match[1].toLowerCase() as keyof typeof CONTENT_TYPES;
  return new Response(method === "HEAD" ? null : (file.body as BodyInit), {
    status: 200,
    headers: {
      "Content-Type": CONTENT_TYPES[ext],
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
