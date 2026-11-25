import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { requireContext } from "@/lib/auth";
import { labelsFor, typeInfo } from "@/lib/labels";
import { roleLabels } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { user, company, role } = await requireContext(companyId);
  const l = labelsFor(company.type);
  const root = `/e/${company.id}`;

  return (
    <div className="shell">
      <Sidebar
        companyId={company.id}
        companyName={company.name}
        typeName={typeInfo[company.type].name}
        roleLabel={roleLabels[role]}
        userName={user.name}
        exportHref={`${root}/exportar`}
        nav={[
          { href: root, label: "Resumen" },
          { href: `${root}/inventario`, label: l.plural },
          company.type === "organizacion"
            ? { href: `${root}/mantenimiento`, label: "Mantenimiento" }
            : { href: `${root}/movimientos`, label: "Movimientos" },
          { href: `${root}/categorias`, label: "Categorías" },
          { href: `${root}/equipo`, label: "Equipo" },
          { href: `${root}/ajustes`, label: "Ajustes" },
        ]}
      />
      <main className="main">{children}</main>
    </div>
  );
}
