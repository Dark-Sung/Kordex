import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { UPLOADS_DIR } from "./paths";

// Límite de tamaño de foto y patrones válidos de nombre de archivo
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const PHOTO_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
export const UUID = /^[0-9a-f-]{36}$/;

// Tipos MIME aceptados por extensión
export const photoMime: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Detecta el formato real del archivo leyendo los bytes de cabecera
function detectExt(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP")
    return "webp";
  return null;
}

// Ruta de la carpeta de fotos de una empresa
export const companyDir = (companyId: string) => path.join(UPLOADS_DIR, companyId);

// Verifica si el valor del formulario es un archivo realmente seleccionado
export function isUpload(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && v instanceof Blob && v.size > 0;
}

// Guarda una foto en disco y devuelve el nombre del archivo generado
export async function savePhoto(
  companyId: string,
  file: File,
): Promise<{ filename: string } | { error: string }> {
  if (file.size > MAX_PHOTO_BYTES) return { error: "La foto pesa más de 4 MB. Elige una más liviana." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectExt(buf);
  if (!ext) return { error: "La foto debe ser JPG, PNG o WebP." };

  const dir = companyDir(companyId);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, filename), buf);
  return { filename };
}

// Elimina una foto del disco de forma segura
export async function deletePhoto(companyId: string, filename?: string): Promise<void> {
  if (!filename || !PHOTO_NAME.test(filename) || !UUID.test(companyId)) return;
  await fs.rm(path.join(companyDir(companyId), filename), { force: true });
}

// Elimina todas las fotos de una empresa
export async function deleteCompanyPhotos(companyId: string): Promise<void> {
  if (!UUID.test(companyId)) return;
  await fs.rm(companyDir(companyId), { recursive: true, force: true });
}

// Construye la URL pública de una foto
export const photoUrl = (companyId: string, filename?: string) =>
  filename ? `/api/fotos/${companyId}/${filename}` : undefined;
