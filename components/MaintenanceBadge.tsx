import { dueLabel, type DueState } from "@/lib/maintenance";

// Mapa de estado de mantenimiento a tono de color del badge
const tone: Record<DueState, string> = { none: "neutral", ok: "ok", soon: "low", overdue: "out" };

// Badge que muestra el estado de mantenimiento de un elemento
export default function MaintenanceBadge({ state }: { state: DueState }) {
  return <span className={`badge ${tone[state]}`}>{dueLabel[state]}</span>;
}
