import { createCategory, deleteCategory } from "@/app/actions/categories";
import ActionForm from "@/components/ActionForm";
import { loadCompanyData } from "@/lib/company-data";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { ctx, categories, items } = await loadCompanyData(companyId);
  const manage = can(ctx.role, "categorias");

  const counts = new Map<string, number>();
  for (const i of items) counts.set(i.categoryId, (counts.get(i.categoryId) ?? 0) + 1);
  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <>
      <header className="page-head">
        <h1>Categorías</h1>
      </header>

      <div className="two-col">
        {manage && (
          <section className="panel">
            <div className="panel-head">
              <h2>Nueva categoría</h2>
            </div>
            <ActionForm action={createCategory.bind(null, companyId)} submitLabel="Crear categoría" resetOnSuccess>
              <label className="field">
                <span>Nombre</span>
                <input name="name" required maxLength={60} />
              </label>
            </ActionForm>
          </section>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>Categorías existentes</h2>
          </div>
          {sorted.length === 0 ? (
            <p className="empty">Aún no hay categorías.</p>
          ) : (
            <ul className="cat-list">
              {sorted.map((c) => {
                const n = counts.get(c.id) ?? 0;
                return (
                  <li key={c.id}>
                    <span>
                      <span className="strong">{c.name}</span>
                      <span className="muted small block">
                        {n} registro{n === 1 ? "" : "s"}
                      </span>
                    </span>
                    {manage && (
                      <ActionForm
                        action={deleteCategory.bind(null, companyId, c.id)}
                        submitLabel="Eliminar"
                        variant="quiet"
                        confirmMessage={`¿Eliminar la categoría «${c.name}»?`}
                        className="inline-form"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
