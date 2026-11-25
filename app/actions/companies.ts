"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorize, NO_PERMISSION, requireUser } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { deleteCompanyPhotos } from "@/lib/photos";
import type { CompanyType, FormState } from "@/lib/types";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const refresh = () => revalidatePath("/", "layout");

// Crea una empresa nueva y asigna al usuario actual como propietario
export async function createCompany(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = text(fd, "name");
  const type = text(fd, "type") as CompanyType;

  if (name.length < 2 || name.length > 80) return { error: "Escribe el nombre de la empresa (entre 2 y 80 caracteres)." };
  if (type !== "tienda" && type !== "organizacion") return { error: "Elige el tipo de inventario." };

  const id = randomUUID();
  await mutate((db) => {
    const now = new Date().toISOString();
    db.companies.push({ id, name, type, createdAt: now });
    db.memberships.push({ userId: user.id, companyId: id, role: "propietario", createdAt: now });
    db.categories.push({ id: randomUUID(), companyId: id, name: "General" });
  });
  refresh();
  redirect(`/e/${id}`);
}

// Cambia el nombre de una empresa
export async function renameCompany(companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const ctx = await authorize(companyId, "empresa");
  if (!ctx) return { error: NO_PERMISSION };
  const name = text(fd, "name");
  if (name.length < 2 || name.length > 80) return { error: "Escribe el nombre de la empresa (entre 2 y 80 caracteres)." };

  await mutate((db) => {
    const c = db.companies.find((x) => x.id === companyId);
    if (c) c.name = name;
  });
  refresh();
  return { ok: "Nombre actualizado." };
}

// Elimina una empresa y todos sus datos, incluidas las fotos
export async function deleteCompany(companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const ctx = await authorize(companyId, "empresa");
  if (!ctx) return { error: NO_PERMISSION };
  if (text(fd, "confirmName") !== ctx.company.name)
    return { error: "Para eliminar la empresa escribe su nombre exactamente como aparece." };

  await mutate((db) => {
    db.companies = db.companies.filter((c) => c.id !== companyId);
    db.memberships = db.memberships.filter((m) => m.companyId !== companyId);
    db.categories = db.categories.filter((c) => c.companyId !== companyId);
    db.items = db.items.filter((i) => i.companyId !== companyId);
    db.movements = db.movements.filter((m) => m.companyId !== companyId);
    db.maintenance = db.maintenance.filter((m) => m.companyId !== companyId);
  });
  await deleteCompanyPhotos(companyId);
  refresh();
  redirect("/empresas");
}
