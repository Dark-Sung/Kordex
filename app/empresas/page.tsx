import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { formatDay } from "@/lib/format";
import { typeInfo } from "@/lib/labels";
import { roleLabels } from "@/lib/permissions";

export default async function EmpresasPage() {
  const user = await requireUser();
  const db = await readDB();

  const mine = db.memberships
    .filter((m) => m.userId === user.id)
    .map((m) => ({ m, company: db.companies.find((c) => c.id === m.companyId) }))
    .filter((x): x is { m: (typeof db.memberships)[number]; company: (typeof db.companies)[number] } => Boolean(x.company))
    .map(({ m, company }) => ({
      company,
      role: m.role,
      items: db.items.filter((i) => i.companyId === company.id).length,
      members: db.memberships.filter((x) => x.companyId === company.id).length,
    }))
    .sort((a, b) => a.company.name.localeCompare(b.company.name, "es"));

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Tus empresas</h1>
          <p className="muted">Elige con cuál quieres trabajar.</p>
        </div>
        <Link href="/empresas/nueva" className="btn primary">
          Registrar empresa
        </Link>
      </header>

      {mine.length === 0 ? (
        <section className="panel">
          <p className="empty">
            Todavía no perteneces a ninguna empresa. <Link href="/empresas/nueva">Registra la tuya</Link>, o pídele a un
            administrador que te agregue con el correo de tu cuenta ({user.email}).
          </p>
        </section>
      ) : (
        <ul className="company-list">
          {mine.map(({ company, role, items, members }) => (
            <li key={company.id}>
              <Link href={`/e/${company.id}`} className="company-card">
                <span className="strong company-name">{company.name}</span>
                <span className="muted small">
                  Inventario de {typeInfo[company.type].name.toLowerCase()} · {roleLabels[role]}
                </span>
                <span className="muted small">
                  {items} {company.type === "tienda" ? "producto" : "elemento"}
                  {items === 1 ? "" : "s"} · {members} persona{members === 1 ? "" : "s"} · creada el{" "}
                  {formatDay(company.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
