import { requireContext } from "./auth";
import { readDB } from "./db";
import { labelsFor } from "./labels";

// Carga el contexto del usuario y todos los datos de una empresa
// Nunca mezcla datos de otras empresas
export async function loadCompanyData(companyId: string) {
  const ctx = await requireContext(companyId);
  const db = await readDB();
  const people = new Map(db.users.map((u) => [u.id, { id: u.id, name: u.name, email: u.email, photo: u.photo }]));
  return {
    ctx,
    l: labelsFor(ctx.company.type),
    categories: db.categories.filter((c) => c.companyId === companyId),
    items: db.items.filter((i) => i.companyId === companyId),
    movements: db.movements.filter((m) => m.companyId === companyId),
    maintenance: db.maintenance.filter((m) => m.companyId === companyId),
    memberships: db.memberships.filter((m) => m.companyId === companyId),
    people,
  };
}
