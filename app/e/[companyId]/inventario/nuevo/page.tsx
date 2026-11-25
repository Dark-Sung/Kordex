import Link from "next/link";
import { notFound } from "next/navigation";
import { createItem } from "@/app/actions/items";
import ActionForm from "@/components/ActionForm";
import ItemFields from "@/components/ItemFields";
import { loadCompanyData } from "@/lib/company-data";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NuevoPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ padre?: string }>;
}) {
  const { companyId } = await params;
  const { padre = "" } = await searchParams;
  const { ctx, l, categories, items } = await loadCompanyData(companyId);
  if (!can(ctx.role, "editar")) notFound();
  const base = `/e/${companyId}`;
  const parent = padre ? items.find((i) => i.id === padre) : undefined;
  if (padre && (!parent || parent.parentId)) notFound(); // solo se puede ser variante de un registro principal

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{parent ? `Nueva variante` : l.newItem}</h1>
          {parent && <p className="muted">De: {parent.name}</p>}
        </div>
        <Link href={parent ? `${base}/inventario/${parent.id}` : `${base}/inventario`} className="btn quiet">
          Volver
        </Link>
      </header>

      {categories.length === 0 ? (
        <section className="panel">
          <p className="empty">
            Antes necesitas al menos una categoría. <Link href={`${base}/categorias`}>Crear categoría</Link>
          </p>
        </section>
      ) : (
        <section className="panel">
          <ActionForm action={createItem.bind(null, companyId)} submitLabel={parent ? "Crear variante" : `Crear ${l.singular}`}>
            <ItemFields
              type={ctx.company.type}
              companyId={companyId}
              categories={categories}
              parent={parent}
              defaults={
                parent
                  ? {
                      categoryId: parent.categoryId,
                      unit: parent.unit,
                      location: parent.location,
                      responsible: parent.responsible,
                      brand: parent.brand,
                      cost: parent.cost,
                      price: parent.price,
                      minStock: parent.minStock,
                      maintenanceEveryDays: parent.maintenanceEveryDays,
                    }
                  : undefined
              }
              withInitialStock
            />
          </ActionForm>
        </section>
      )}
    </>
  );
}
