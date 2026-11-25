"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/types";

// Botón de envío que se deshabilita mientras la acción está en curso
function Submit({ label, variant, block }: { label: string; variant: string; block?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn ${variant}${block ? " block-btn" : ""}`} disabled={pending}>
      {pending ? "Un momento…" : label}
    </button>
  );
}

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  submitLabel: string;
  variant?: "primary" | "danger" | "quiet";
  confirmMessage?: string;
  resetOnSuccess?: boolean;
  fullWidthButton?: boolean;
  className?: string;
  children?: ReactNode;
};

// Formulario genérico que conecta una server action y muestra errores o confirmaciones
export default function ActionForm({
  action,
  submitLabel,
  variant = "primary",
  confirmMessage,
  resetOnSuccess = false,
  fullWidthButton = false,
  className,
  children,
}: Props) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  // Limpia el formulario después de un éxito si se pidió
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
      {state?.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="notice success" role="status">
          {state.ok}
        </p>
      )}
      <div className="form-actions">
        <Submit label={submitLabel} variant={variant} block={fullWidthButton} />
      </div>
    </form>
  );
}
