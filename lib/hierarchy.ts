import type { Item } from "./types";

// Devuelve los hijos directos (variantes) de un registro
export function childrenOf(items: Item[], parentId: string): Item[] {
  return items.filter((i) => i.parentId === parentId);
}

// Indica si un registro tiene variantes
export function hasChildren(items: Item[], id: string): boolean {
  return items.some((i) => i.parentId === id);
}

// Suma el stock propio más el de todas sus variantes
export function totalStock(items: Item[], item: Item): number {
  return item.stock + childrenOf(items, item.id).reduce((s, c) => s + c.stock, 0);
}

// Construye el texto "Marca · Modelo" con lo que haya disponible
export function brandModel(i: Pick<Item, "brand" | "model">): string {
  return [i.brand, i.model].filter(Boolean).join(" · ");
}

// Ordena los registros para mostrarlos: cada padre seguido de sus variantes
// Si un hijo coincide con el filtro pero su padre no, el hijo igual se muestra
export function inTreeOrder(all: Item[], visible: Item[]): { item: Item; depth: 0 | 1 }[] {
  const ids = new Set(visible.map((i) => i.id));
  const byName = (a: Item, b: Item) => a.name.localeCompare(b.name, "es");
  const out: { item: Item; depth: 0 | 1 }[] = [];
  const parents = all.filter((i) => !i.parentId).sort(byName);
  for (const p of parents) {
    const kids = all.filter((c) => c.parentId === p.id && ids.has(c.id)).sort(byName);
    if (ids.has(p.id) || kids.length) {
      out.push({ item: p, depth: 0 });
      for (const k of kids) out.push({ item: k, depth: 1 });
    }
  }
  return out;
}
