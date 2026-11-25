"use client";

import { useState } from "react";
import { intervalPresets } from "@/lib/maintenance";

// Campo para configurar la frecuencia de mantenimiento de un elemento
// Envía un solo campo hidden: maintenanceEveryDays (en días)
export default function MaintenanceField({ defaultDays }: { defaultDays?: number }) {
  const preset = intervalPresets.some((p) => p.days === defaultDays);
  const [choice, setChoice] = useState<string>(defaultDays ? (preset ? String(defaultDays) : "custom") : "");
  const [custom, setCustom] = useState<string>(defaultDays && !preset ? String(defaultDays) : "");

  const value = choice === "custom" ? custom : choice;

  return (
    <div className="field wide">
      <span>Mantenimiento periódico</span>
      <div className="inline-fields">
        <select value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="Frecuencia de mantenimiento">
          <option value="">No requiere mantenimiento</option>
          {intervalPresets.map((p) => (
            <option key={p.days} value={p.days}>
              {p.label}
            </option>
          ))}
          <option value="custom">Otro intervalo…</option>
        </select>
        {/* Campo de días personalizados, visible solo cuando se elige "Otro intervalo" */}
        {choice === "custom" && (
          <label className="inline-days">
            Cada
            <input
              type="number"
              min={1}
              max={3650}
              step={1}
              required
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-label="Días entre mantenimientos"
            />
            días
          </label>
        )}
      </div>
      <input type="hidden" name="maintenanceEveryDays" value={value} />
      <small>Si lo necesita, el elemento aparecerá en Mantenimiento cuando se acerque la fecha, con un botón para confirmarlo.</small>
    </div>
  );
}
