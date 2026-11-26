"use client";

import { useState } from "react";

export default function CopyItemId({ code }: { code: string }) {
  const [message, setMessage] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("ID copiado.");
    } catch {
      setMessage("No se pudo copiar. Selecciona el ID y cópialo manualmente.");
    }
  }

  return (
    <>
      <button type="button" className="link-btn copy-item-id" onClick={copy}>
        Copiar ID
      </button>
      <span className="small" role="status">{message}</span>
    </>
  );
}
