import type { Item } from "./types";

// Niveles de stock posibles
export type StockLevel = "ok" | "low" | "out";

// Calcula el nivel de stock según las existencias y el mínimo configurado
export function stockLevel(p: Pick<Item, "stock" | "minStock">): StockLevel {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.minStock) return "low";
  return "ok";
}

// Etiquetas visibles de cada nivel de stock
export const levelLabel: Record<StockLevel, string> = {
  ok: "Disponible",
  low: "Stock bajo",
  out: "Agotado",
};
