import { promises as fs } from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { PHOTO_NAME, photoMime, profilePhotoDir, UUID } from "@/lib/photos";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string; file: string }> }) {
  const { userId, file } = await params;
  const missing = () => new Response("No encontrado", { status: 404 });
  if (!UUID.test(userId) || !PHOTO_NAME.test(file)) return missing();

  const viewer = await getCurrentUser();
  if (!viewer) return missing();

  const db = await readDB();
  if (!db.users.some((user) => user.id === userId && user.photo === file)) return missing();
  if (viewer.id !== userId) {
    const companies = new Set(db.memberships.filter((m) => m.userId === viewer.id).map((m) => m.companyId));
    if (!db.memberships.some((m) => m.userId === userId && companies.has(m.companyId))) return missing();
  }

  try {
    const bytes = await fs.readFile(path.join(profilePhotoDir(userId), file));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": photoMime[path.extname(file).slice(1)],
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return missing();
  }
}
