"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorize, NO_PERMISSION } from "@/lib/auth";
import { mutate, readDB } from "@/lib/db";
import { conditions } from "@/lib/labels";
import { diffItem } from "@/lib/maintenance";
import { deletePhoto, isUpload, savePhoto } from "@/lib/photos";
import type { CompanyType, Condition, DB, FormState, Item, MaintenanceKind, MovementType } from "@/lib/types";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const refresh = () => revalidatePath("/", "layout");

type ItemData = Omit<Item, "id" | "companyId" | "stock" | "photo" | "parentId" | "lastMaintenanceAt" | "createdAt" | "updatedAt">;

const MAX_INTERVAL_DAYS = 3650;

// Lee y valida los campos del formulario de un item según el tipo de empresa
function parseItem(
  type: CompanyType,
  fd: FormData,
  opts: { categoryFromParent: boolean },
): { error: string } | { data: ItemData } {
  const code = text(fd, "code").toUpperCase();
  const name = text(fd, "name");
  const categoryId = text(fd, "categoryId");
  const unit = text(fd, "unit") || "und";
  const location = text(fd, "location");
  const brand = text(fd, "brand");
  const model = text(fd, "model");

  if (!code) return { error: `Escribe el ${type === "tienda" ? "SKU" : "código"}.` };
  if (code.length > 40) return { error: "El código es demasiado largo (máximo 40 caracteres)." };
  if (!name) return { error: "Escribe el nombre." };
  if (name.length > 120) return { error: "El nombre es demasiado largo (máximo 120 caracteres)." };
  if (!categoryId && !opts.categoryFromParent) return { error: "Elige una categoría." };
  if (unit.length > 12 || location.length > 60) return { error: "La unidad o la ubicación son demasiado largas." };
  if (brand.length > 60 || model.length > 60) return { error: "La marca o el modelo son demasiado largos (máximo 60 caracteres)." };

  // Validaciones específicas de tienda
  if (type === "tienda") {
    const cost = Number(text(fd, "cost") || "0");
    const price = Number(text(fd, "price") || "0");
    const minStock = Number(text(fd, "minStock") || "0");
    if (!Number.isFinite(cost) || cost < 0) return { error: "El costo debe ser un número mayor o igual a 0." };
    if (!Number.isFinite(price) || price < 0) return { error: "El precio debe ser un número mayor o igual a 0." };
    if (!Number.isInteger(minStock) || minStock < 0)
      return { error: "El stock mínimo debe ser un entero mayor o igual a 0." };
    return {
      data: {
        code, name, categoryId, unit, location, brand, model, cost, price, minStock,
        serial: "", responsible: "", notes: "",
      },
    };
  }

  // Validaciones específicas de organización
  const condition = text(fd, "condition") as Condition;
  const serial = text(fd, "serial");
  const responsible = text(fd, "responsible");
  const notes = text(fd, "notes");
  if (!conditions.includes(condition)) return { error: "Elige el estado del elemento." };
  if (serial.length > 60 || responsible.length > 80) return { error: "El serial o el responsable son demasiado largos." };
  if (notes.length > 500) return { error: "Las notas son demasiado largas (máximo 500 caracteres)." };

  const everyRaw = text(fd, "maintenanceEveryDays");
  let maintenanceEveryDays: number | undefined;
  if (everyRaw) {
    const n = Number(everyRaw);
    if (!Number.isInteger(n) || n < 1 || n > MAX_INTERVAL_DAYS)
      return { error: `El mantenimiento debe repetirse cada un número entero de días (entre 1 y ${MAX_INTERVAL_DAYS}), o dejarse vacío.` };
    maintenanceEveryDays = n;
  }
  return {
    data: {
      code, name, categoryId, unit, location, brand, model, cost: 0, price: 0, minStock: 0,
      condition, serial, responsible, notes, maintenanceEveryDays,
    },
  };
}

// Agrega un registro al historial de mantenimiento o cambios
function addRecord(
  db: DB,
  companyId: string,
  itemId: string,
  userId: string,
  kind: MaintenanceKind,
  note: string,
  changes: { field: string; from: string; to: string }[] = [],
  at = new Date().toISOString(),
) {
  db.maintenance.push({ id: randomUUID(), companyId, itemId, kind, note, changes, userId, createdAt: at });
}

// Crea un item nuevo en el inventario
export async function createItem(companyId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const ctx = await authorize(companyId, "editar");
  if (!ctx) return { error: NO_PERMISSION };

  const parentId = text(fd, "parentId") || undefined;
  const parsed = parseItem(ctx.company.type, fd, { categoryFromParent: Boolean(parentId) });
  if ("error" in parsed) return { error: parsed.error };
  const initial = Number(text(fd, "stock") || "0");
  if (!Number.isInteger(initial) || initial < 0)
    return { error: "La cantidad inicial debe ser un entero mayor o igual a 0." };

  // Guarda la foto si se adjuntó una
  let photo: string | undefined;
  const file = fd.get("photo");
  if (isUpload(file)) {
    const saved = await savePhoto(companyId, file);
    if ("error" in saved) return { error: saved.error };
    photo = saved.filename;
  }

  const result = await mutate((db): { error: string } | { id: string } => {
    const data = { ...parsed.data };
    if (parentId) {
      const parent = db.items.find((i) => i.companyId === companyId && i.id === parentId);
      if (!parent) return { error: "El registro principal ya no existe." };
      if (parent.parentId) return { error: "Una variante no puede tener sus propias variantes (solo un nivel)." };
      data.categoryId = parent.categoryId;
    }
    if (db.items.some((i) => i.companyId === companyId && i.code.toLowerCase() === data.code.toLowerCase()))
      return { error: "Ya existe un registro con ese código." };
    if (!db.categories.some((c) => c.companyId === companyId && c.id === data.categoryId))
      return { error: "La categoría elegida ya no existe." };

    const now = new Date().toISOString();
    const id = randomUUID();
    db.items.push({ id, companyId, ...data, stock: initial, photo, parentId, createdAt: now, updatedAt: now });

    // En organización deja constancia en el historial; en tienda anota el stock inicial
    if (ctx.company.type === "organizacion") {
      addRecord(db, companyId, id, ctx.user.id, "cambio", parentId ? "Variante registrada" : "Elemento registrado", [], now);
    } else if (initial > 0) {
      db.movements.push({
        id: randomUUID(),
        companyId,
        itemId: id,
        type: "entrada",
        delta: initial,
        stockAfter: initial,
        note: "Stock inicial",
        userId: ctx.user.id,
        createdAt: now,
      });
    }
    return { id };
  });

  if ("error" in result) {
    await deletePhoto(companyId, photo);
    return { error: result.error };
  }
  refresh();
  redirect(`/e/${companyId}/inventario/${result.id}`);
}

// Edita los datos de un item existente
export async function updateItem(
  companyId: string,
  itemId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const ctx = await authorize(companyId, "editar");
  if (!ctx) return { error: NO_PERMISSION };
  const isOrg = ctx.company.type === "organizacion";

  const current = (await readDB()).items.find(
    (i) => i.companyId === companyId && i.id === itemId,
  );
  if (!current) return { error: "El registro ya no existe." };

  const parsed = parseItem(ctx.company.type, fd, { categoryFromParent: Boolean(current.parentId) });
  if ("error" in parsed) return { error: parsed.error };

  // En organización la cantidad se puede editar directamente y queda en el historial
  let newStock: number | undefined;
  if (isOrg && fd.has("stock")) {
    newStock = Number(text(fd, "stock"));
    if (!Number.isInteger(newStock) || newStock < 0) return { error: "La cantidad debe ser un entero mayor o igual a 0." };
  }

  // Procesa la foto: nueva, eliminada o sin cambios
  let newPhoto: string | undefined;
  const file = fd.get("photo");
  if (isUpload(file)) {
    const saved = await savePhoto(companyId, file);
    if ("error" in saved) return { error: saved.error };
    newPhoto = saved.filename;
  }
  const removePhoto = fd.get("removePhoto") === "on";

  const result = await mutate((db): { error: string } | { oldPhoto?: string; changed: number } => {
    const data = { ...parsed.data };
    const item = db.items.find((i) => i.companyId === companyId && i.id === itemId);
    if (!item) return { error: "El registro ya no existe." };
    if (item.parentId) {
      const parent = db.items.find((i) => i.id === item.parentId);
      if (parent) data.categoryId = parent.categoryId;
    }
    if (db.items.some((i) => i.companyId === companyId && i.id !== itemId && i.code.toLowerCase() === data.code.toLowerCase()))
      return { error: "Ya existe otro registro con ese código." };
    if (!db.categories.some((c) => c.companyId === companyId && c.id === data.categoryId))
      return { error: "La categoría elegida ya no existe." };

    const before = { ...item };
    const oldPhoto = item.photo;
    const now = new Date().toISOString();
    Object.assign(item, data, { updatedAt: now });
    if (newStock !== undefined) item.stock = newStock;
    if (newPhoto) item.photo = newPhoto;
    else if (removePhoto) item.photo = undefined;

    // Si cambia la categoría del padre, se propaga a todas sus variantes
    if (!item.parentId && before.categoryId !== item.categoryId) {
      for (const child of db.items) if (child.parentId === item.id) child.categoryId = item.categoryId;
    }

    // En organización genera una entrada en el historial si hubo cambios
    let changed = 0;
    if (isOrg) {
      const catName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? "—";
      const changes = diffItem(before, item, { category: catName });
      if (changes.length) {
        addRecord(db, companyId, itemId, ctx.user.id, "cambio", "", changes, now);
        changed = changes.length;
      }
    }
    return { oldPhoto: newPhoto || removePhoto ? oldPhoto : undefined, changed };
  });

  if ("error" in result) {
    await deletePhoto(companyId, newPhoto);
    return { error: result.error };
  }
  await deletePhoto(companyId, result.oldPhoto);
  refresh();
  return { ok: result.changed ? `Cambios guardados (${result.changed} modificado${result.changed === 1 ? "" : "s"}) y anotados en el historial.` : "Cambios guardados." };
}

// Elimina un item y su historial asociado
export async function deleteItem(
  companyId: string,
  itemId: string,
  _prev: FormState,
  _fd: FormData,
): Promise<FormState> {
  const ctx = await authorize(companyId, "eliminar");
  if (!ctx) return { error: NO_PERMISSION };

  const result = await mutate((db): { error: string } | { photo?: string } => {
    const item = db.items.find((i) => i.companyId === companyId && i.id === itemId);
    if (!item) return { photo: undefined };
    const kids = db.items.filter((i) => i.companyId === companyId && i.parentId === itemId).length;
    if (kids > 0)
      return {
        error: `No se puede eliminar: tiene ${kids} variante${kids === 1 ? "" : "s"}. Elimínalas primero.`,
      };
    db.items = db.items.filter((i) => !(i.companyId === companyId && i.id === itemId));
    db.movements = db.movements.filter((m) => !(m.companyId === companyId && m.itemId === itemId));
    db.maintenance = db.maintenance.filter((m) => !(m.companyId === companyId && m.itemId === itemId));
    return { photo: item.photo };
  });
  if ("error" in result) return { error: result.error };
  await deletePhoto(companyId, result.photo);
  refresh();
  redirect(`/e/${companyId}/inventario`);
}

// Registra una entrada, salida o ajuste de stock (solo tienda)
export async function registerMovement(
  companyId: string,
  itemId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const ctx = await authorize(companyId, "mover");
  if (!ctx) return { error: NO_PERMISSION };
  if (ctx.company.type !== "tienda") return { error: "Los movimientos de cantidad solo existen en inventarios de tipo tienda." };

  const type = text(fd, "type") as MovementType;
  const qty = Number(text(fd, "quantity"));
  const note = text(fd, "note");

  if (!["entrada", "salida", "ajuste"].includes(type)) return { error: "Elige el tipo de movimiento." };
  if (!Number.isInteger(qty) || qty < 0) return { error: "La cantidad debe ser un entero mayor o igual a 0." };
  if (type !== "ajuste" && qty === 0) return { error: "La cantidad debe ser mayor que 0." };
  if (note.length > 160) return { error: "La nota es demasiado larga (máximo 160 caracteres)." };

  const result = await mutate((db): { error: string } | { ok: string } => {
    const item = db.items.find((i) => i.companyId === companyId && i.id === itemId);
    if (!item) return { error: "El registro ya no existe." };

    // Calcula el delta según el tipo de movimiento
    let delta: number;
    if (type === "entrada") delta = qty;
    else if (type === "salida") {
      if (qty > item.stock)
        return { error: `Solo hay ${item.stock} ${item.unit} disponibles; no se pueden sacar ${qty}.` };
      delta = -qty;
    } else {
      delta = qty - item.stock;
      if (delta === 0) return { error: "El conteo coincide con la cantidad actual; no hay nada que ajustar." };
    }

    const now = new Date().toISOString();
    item.stock += delta;
    item.updatedAt = now;
    db.movements.push({
      id: randomUUID(),
      companyId,
      itemId,
      type,
      delta,
      stockAfter: item.stock,
      note,
      userId: ctx.user.id,
      createdAt: now,
    });
    return { ok: `Movimiento registrado. Cantidad actual: ${item.stock} ${item.unit}.` };
  });

  if ("error" in result) return { error: result.error };
  refresh();
  return { ok: result.ok };
}

// Confirma que el mantenimiento ya se realizó y reinicia el contador de días
export async function confirmMaintenance(
  companyId: string,
  itemId: string,
  _prev: FormState,
  _fd: FormData,
): Promise<FormState> {
  const ctx = await authorize(companyId, "mantener");
  if (!ctx) return { error: NO_PERMISSION };
  if (ctx.company.type !== "organizacion") return { error: "El mantenimiento solo existe en inventarios de organización." };

  const result = await mutate((db): { error: string } | { ok: string } => {
    const item = db.items.find((i) => i.companyId === companyId && i.id === itemId);
    if (!item) return { error: "El elemento ya no existe." };
    const now = new Date().toISOString();
    item.lastMaintenanceAt = now;
    item.updatedAt = now;
    addRecord(db, companyId, itemId, ctx.user.id, "mantenimiento", "Mantenimiento realizado", [], now);
    return { ok: "Confirmado" };
  });
  if ("error" in result) return { error: result.error };
  refresh();
  return { ok: result.ok };
}

// Registra un mantenimiento con detalle o un cambio manual en el elemento
export async function registerMaintenance(
  companyId: string,
  itemId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const ctx = await authorize(companyId, "mantener");
  if (!ctx) return { error: NO_PERMISSION };
  if (ctx.company.type !== "organizacion") return { error: "El mantenimiento solo existe en inventarios de organización." };

  const kind = text(fd, "kind") as MaintenanceKind;
  const note = text(fd, "note");
  if (kind !== "mantenimiento" && kind !== "cambio") return { error: "Elige si es un mantenimiento o un cambio." };
  if (!note) return { error: "Describe qué se hizo." };
  if (note.length > 300) return { error: "La descripción es demasiado larga (máximo 300 caracteres)." };

  const result = await mutate((db): { error: string } | { ok: true } => {
    const item = db.items.find((i) => i.companyId === companyId && i.id === itemId);
    if (!item) return { error: "El elemento ya no existe." };
    const now = new Date().toISOString();
    if (kind === "mantenimiento") item.lastMaintenanceAt = now;
    item.updatedAt = now;
    addRecord(db, companyId, itemId, ctx.user.id, kind, note, [], now);
    return { ok: true };
  });
  if ("error" in result) return { error: result.error };
  refresh();
  return { ok: kind === "mantenimiento" ? "Mantenimiento registrado." : "Cambio registrado." };
}
