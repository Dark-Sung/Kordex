import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) redirect("/empresas");
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">Inventario</div>
        {children}
      </div>
    </div>
  );
}
