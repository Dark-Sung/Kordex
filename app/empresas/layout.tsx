import type { ReactNode } from "react";
import TopBar from "@/components/TopBar";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EmpresasLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <TopBar user={user} />
      <main className="centered">{children}</main>
    </>
  );
}
