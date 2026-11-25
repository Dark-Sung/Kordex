import { conditionLabels, conditionTone } from "@/lib/labels";
import { levelLabel, stockLevel } from "@/lib/stock";
import type { Condition } from "@/lib/types";

// Badge que muestra el nivel de stock (disponible, bajo o agotado)
export function StatusBadge({ stock, min }: { stock: number; min: number }) {
  const level = stockLevel({ stock, minStock: min });
  return <span className={`badge ${level}`}>{levelLabel[level]}</span>;
}

// Badge que muestra la condición de un elemento de organización
export function ConditionBadge({ condition }: { condition?: Condition }) {
  if (!condition) return <span className="muted">—</span>;
  return <span className={`badge ${conditionTone[condition]}`}>{conditionLabels[condition]}</span>;
}
