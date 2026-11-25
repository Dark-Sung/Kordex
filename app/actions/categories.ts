"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { authorize, NO_PERMISSION } from "@/lib/auth";
import { mutate } from "@/lib/db";
import type { FormState } from "@/lib/types";

const refresh = () => revalidatePath("/", "layout");

// Crea una categoría nueva en la empresa
export async function createCategory(companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const ctx = await authorize(companyId, "categorias");
  if (!ctx) return { error: NO_PERMISSION };
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Escribe el nombre de la categoría." };
  if (name.length > 60) return { error: "El nombre es demasiado largo (máximo 60 caracteres)." };

  const result = await mutate((db): { error: string } | { ok: true } => {
    if (db.categories.some((c) => c.companyId === companyId && c.name.toLowerCase() === name.toLowerCase()))
      return { error: "Ya existe una categoría con ese nombre." };
    db.categories.push({ id: randomUUID(), companyId, name });
    return { ok: true };
  });
  if ("error" in result) return { error: result.error };
  refresh();
  return { ok: `Categoría «${name}» creada.` };
}

// Elimina una categoría si no tiene registros asignados
export async function deleteCategory(
  companyId: string,
  id: string,
  _prev: FormState,
  _fd: FormData,
): Promise<FormState> {
  const ctx = await authorize(companyId, "categorias");
  if (!ctx) return { error: NO_PERMISSION };

  const result = await mutate((db): { error: string } | { ok: true } => {
    const used = db.items.filter((i) => i.companyId === companyId && i.categoryId === id).length;
    if (used > 0)
      return {
        error: `No se puede eliminar: ${used} registro${used === 1 ? "" : "s"} la usa${used === 1 ? "" : "n"}. Cámbialos de categoría primero.`,
      };
    db.categories = db.categories.filter((c) => !(c.companyId === companyId && c.id === id));
    return { ok: true };
  });
  if ("error" in result) return { error: result.error };
  refresh();
  return undefined;
}
