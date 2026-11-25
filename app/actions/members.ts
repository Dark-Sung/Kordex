"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorize, getContext, NO_PERMISSION, requireUser } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { assignableRoles, canManageMember } from "@/lib/permissions";
import type { FormState, Role } from "@/lib/types";

const refresh = () => revalidatePath("/", "layout");
const LAST_OWNER = "Debe quedar al menos un propietario. Asigna ese rol a otra persona primero.";

// Agrega un usuario al equipo de la empresa por correo
export async function addMember(companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const ctx = await authorize(companyId, "miembros");
  if (!ctx) return { error: NO_PERMISSION };

  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role") ?? "") as Role;
  if (!email) return { error: "Escribe el correo de la cuenta que quieres agregar." };
  if (!assignableRoles(ctx.role).includes(role)) return { error: "No puedes asignar ese rol." };

  const result = await mutate((db): { error: string } | { ok: string } => {
    const user = db.users.find((u) => u.email === email);
    if (!user)
      return { error: "No hay ninguna cuenta con ese correo. La persona debe registrarse primero en la página de registro." };
    if (db.memberships.some((m) => m.userId === user.id && m.companyId === companyId))
      return { error: `${user.name} ya forma parte de esta empresa.` };
    db.memberships.push({ userId: user.id, companyId, role, createdAt: new Date().toISOString() });
    return { ok: `${user.name} se agregó al equipo.` };
  });
  if ("error" in result) return { error: result.error };
  refresh();
  return { ok: result.ok };
}

// Cambia el rol de un miembro del equipo
export async function changeMemberRole(
  companyId: string,
  userId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const ctx = await authorize(companyId, "miembros");
  if (!ctx) return { error: NO_PERMISSION };
  const role = String(fd.get("role") ?? "") as Role;
  if (!assignableRoles(ctx.role).includes(role)) return { error: "No puedes asignar ese rol." };

  const result = await mutate((db): { error: string } | { ok: true } => {
    const target = db.memberships.find((m) => m.companyId === companyId && m.userId === userId);
    if (!target) return { error: "Esa persona ya no está en el equipo." };
    if (!canManageMember(ctx.role, target.role)) return { error: NO_PERMISSION };
    const owners = db.memberships.filter((m) => m.companyId === companyId && m.role === "propietario").length;
    if (target.role === "propietario" && role !== "propietario" && owners <= 1) return { error: LAST_OWNER };
    target.role = role;
    return { ok: true };
  });
  if ("error" in result) return { error: result.error };
  refresh();
  return { ok: "Rol actualizado." };
}

// Elimina a un miembro del equipo
export async function removeMember(
  companyId: string,
  userId: string,
  _prev: FormState,
  _fd: FormData,
): Promise<FormState> {
  const ctx = await authorize(companyId, "miembros");
  if (!ctx) return { error: NO_PERMISSION };
  if (userId === ctx.user.id) return { error: "Para irte de la empresa usa «Salir de la empresa» en Ajustes." };

  const result = await mutate((db): { error: string } | { ok: true } => {
    const target = db.memberships.find((m) => m.companyId === companyId && m.userId === userId);
    if (!target) return { error: "Esa persona ya no está en el equipo." };
    if (!canManageMember(ctx.role, target.role)) return { error: NO_PERMISSION };
    db.memberships = db.memberships.filter((m) => !(m.companyId === companyId && m.userId === userId));
    return { ok: true };
  });
  if ("error" in result) return { error: result.error };
  refresh();
  return undefined;
}

// El usuario actual abandona la empresa voluntariamente
export async function leaveCompany(companyId: string, _prev: FormState, _fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const ctx = await getContext(companyId);
  if (!ctx) return { error: NO_PERMISSION };

  const result = await mutate((db): { error: string } | { ok: true } => {
    const me = db.memberships.find((m) => m.companyId === companyId && m.userId === user.id);
    if (!me) return { error: NO_PERMISSION };
    const owners = db.memberships.filter((m) => m.companyId === companyId && m.role === "propietario").length;
    if (me.role === "propietario" && owners <= 1)
      return { error: "Eres el único propietario. Asigna ese rol a otra persona o elimina la empresa." };
    db.memberships = db.memberships.filter((m) => !(m.companyId === companyId && m.userId === user.id));
    return { ok: true };
  });
  if ("error" in result) return { error: result.error };
  refresh();
  redirect("/empresas");
}
