import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import KordexLogo from "@/components/KordexLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) redirect("/empresas");
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand-row">
          <KordexLogo className="auth-brand" priority />
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  );
}
