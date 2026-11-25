import { conditionLabels } from "./labels";
import type { ChangeEntry, Item } from "./types";

const DAY = 86_400_000;

// Estado del mantenimiento de un elemento
export type DueState = "none" | "ok" | "soon" | "overdue";

// Días antes del vencimiento en que se muestra la alerta "Próximo"
export const SOON_DAYS = 7;

// Calcula la fecha en que toca el próximo mantenimiento
export function nextDue(item: Pick<Item, "maintenanceEveryDays" | "lastMaintenanceAt" | "createdAt">): Date | null {
  if (!item.maintenanceEveryDays) return null;
  const from = Date.parse(item.lastMaintenanceAt ?? item.createdAt);
  return new Date(from + item.maintenanceEveryDays * DAY);
}

// Devuelve el estado, la fecha y los días restantes del mantenimiento
export function dueInfo(
  item: Pick<Item, "maintenanceEveryDays" | "lastMaintenanceAt" | "createdAt">,
  now = Date.now(),
): { state: DueState; due: Date | null; days: number } {
  const due = nextDue(item);
  if (!due) return { state: "none", due: null, days: 0 };
  const days = Math.ceil((due.getTime() - now) / DAY);
  const state: DueState = days < 0 ? "overdue" : days <= SOON_DAYS ? "soon" : "ok";
  return { state, due, days };
}

// Etiquetas visibles del estado de mantenimiento
export const dueLabel: Record<DueState, string> = {
  none: "Sin plan",
  ok: "Al día",
  soon: "Próximo",
  overdue: "Vencido",
};

// Genera texto legible con los días restantes u omitidos
export function dueText(days: number): string {
  if (days === 0) return "hoy";
  if (days > 0) return `en ${days} día${days === 1 ? "" : "s"}`;
  const n = Math.abs(days);
  return `hace ${n} día${n === 1 ? "" : "s"}`;
}

// Opciones predefinidas de intervalo de mantenimiento
export const intervalPresets: { days: number; label: string }[] = [
  { days: 7, label: "Cada semana" },
  { days: 30, label: "Cada mes" },
  { days: 90, label: "Cada 3 meses" },
  { days: 180, label: "Cada 6 meses" },
  { days: 365, label: "Cada año" },
];

// Convierte un número de días en texto legible
export function intervalText(days?: number): string {
  if (!days) return "Sin mantenimiento programado";
  const preset = intervalPresets.find((p) => p.days === days);
  return preset ? preset.label : `Cada ${days} días`;
}

// Campos del elemento que se rastrean en el historial de cambios
const TRACKED: { field: keyof Item; label: string; show?: (v: unknown) => string }[] = [
  { field: "code", label: "Código" },
  { field: "name", label: "Nombre" },
  { field: "brand", label: "Marca" },
  { field: "model", label: "Modelo" },
  { field: "unit", label: "Unidad" },
  { field: "stock", label: "Cantidad" },
  { field: "condition", label: "Estado", show: (v) => (v ? conditionLabels[v as keyof typeof conditionLabels] ?? String(v) : "") },
  { field: "responsible", label: "Responsable" },
  { field: "serial", label: "Número de serie" },
  { field: "location", label: "Ubicación" },
  { field: "notes", label: "Notas" },
  {
    field: "maintenanceEveryDays",
    label: "Mantenimiento",
    show: (v) => (v ? intervalText(v as number) : "Sin plan"),
  },
];

// Compara dos versiones de un elemento y devuelve la lista de campos que cambiaron
export function diffItem(
  before: Item,
  after: Item,
  names: { category: (id: string) => string },
): ChangeEntry[] {
  const out: ChangeEntry[] = [];
  for (const t of TRACKED) {
    const a = before[t.field];
    const b = after[t.field];
    if ((a ?? "") === (b ?? "")) continue;
    const fmt = (v: unknown) => (t.show ? t.show(v) : v === undefined || v === null ? "" : String(v));
    out.push({ field: t.label, from: fmt(a) || "—", to: fmt(b) || "—" });
  }
  if (before.categoryId !== after.categoryId)
    out.push({ field: "Categoría", from: names.category(before.categoryId), to: names.category(after.categoryId) });
  if ((before.photo ?? "") !== (after.photo ?? ""))
    out.push({ field: "Foto", from: before.photo ? "Con foto" : "Sin foto", to: after.photo ? "Con foto" : "Sin foto" });
  return out;
}
