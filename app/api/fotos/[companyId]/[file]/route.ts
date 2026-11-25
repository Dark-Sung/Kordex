import { promises as fs } from "fs";
import path from "path";
import { getContext } from "@/lib/auth";
import { companyDir, PHOTO_NAME, photoMime, UUID } from "@/lib/photos";

export const dynamic = "force-dynamic";

/** Sirve una foto solo a personas que pertenecen a la empresa dueña de la foto. */
export async function GET(_req: Request, { params }: { params: Promise<{ companyId: string; file: string }> }) {
  const { companyId, file } = await params;
  if (!UUID.test(companyId) || !PHOTO_NAME.test(file)) return new Response("No encontrado", { status: 404 });

  const ctx = await getContext(companyId);
  if (!ctx) return new Response("No encontrado", { status: 404 });

  try {
    const data = await fs.readFile(path.join(companyDir(companyId), file));
    const ext = file.split(".").pop() as string;
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": photoMime[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
