"use client";

import { useState } from "react";

const MAX_BYTES = 4 * 1024 * 1024;

// Campo de foto con vista previa y opción de quitar la foto actual
export default function PhotoField({ currentUrl }: { currentUrl?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const shown = preview ?? (remove ? null : (currentUrl ?? null));

  return (
    <div className="field wide photo-field">
      <span>Foto de referencia (opcional)</span>
      <div className="photo-row">
        <div className="photo-box">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="Vista previa de la foto" />
          ) : (
            <span className="muted small">Sin foto</span>
          )}
        </div>
        <div className="photo-controls">
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setProblem(null);
              if (!file) {
                setPreview(null);
                return;
              }
              // Valida el tamaño antes de generar la vista previa
              if (file.size > MAX_BYTES) {
                setProblem("La foto pesa más de 4 MB. Elige una más liviana.");
                e.target.value = "";
                setPreview(null);
                return;
              }
              setRemove(false);
              setPreview(URL.createObjectURL(file));
            }}
          />
          <small>JPG, PNG o WebP, hasta 4 MB.</small>
          {problem && (
            <p className="notice error" role="alert">
              {problem}
            </p>
          )}
          {currentUrl && (
            <label className="check">
              <input
                type="checkbox"
                name="removePhoto"
                checked={remove}
                onChange={(e) => {
                  setRemove(e.target.checked);
                  if (e.target.checked) setPreview(null);
                }}
              />
              Quitar la foto actual
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
