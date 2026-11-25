import Link from "next/link";
import ItemThumb from "@/components/ItemThumb";
import StockGauge from "@/components/StockGauge";
import { ConditionBadge, StatusBadge } from "@/components/StatusBadge";
import { loadCompanyData } from "@/lib/company-data";
import { formatMoney, formatNumber } from "@/lib/format";
import { brandModel, childrenOf, inTreeOrder, totalStock } from "@/lib/hierarchy";
import { conditionLabels, conditions } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { stockLevel } from "@/lib/stock";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; cat?: string; estado?: string }>;

export default async function InventarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: SearchParams;
}) {
  const { companyId } = await params;
  const { q = "", cat = "", estado = "" } = await searchParams;
  const { ctx, l, categories, items } = await loadCompanyData(companyId);
  const isStore = ctx.company.type === "tienda";
  const base = `/e/${companyId}`;
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const term = q.trim().toLowerCase();
  const filtering = Boolean(term || cat || estado);

  const rows = items
    .filter((p) => {
      if (term && !`${p.name} ${p.code} ${p.location} ${p.responsible} ${p.serial} ${p.brand} ${p.model}`.toLowerCase().includes(term))
        return false;
      if (cat && p.categoryId !== cat) return false;
      if (estado) {
        if (isStore) {
          const level = stockLevel(p);
          if (estado === "bajo" && level !== "low") return false;
          if (estado === "agotado" && level !== "out") return false;
          if (estado === "disponible" && level !== "ok") return false;
        } else if (p.condition !== estado) return false;
      }
      return true;
    });
  const tree = inTreeOrder(items, rows);

  return (
    <>
      <header className="page-head">
        <h1>{l.plural}</h1>
        {can(ctx.role, "editar") && (
          <Link href={`${base}/inventario/nuevo`} className="btn primary">
            {l.newItem}
          </Link>
        )}
      </header>

      <form method="get" className="filters">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar por nombre, ID, marca o ubicación" aria-label="Buscar" />
        <select name="cat" defaultValue={cat} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="estado" defaultValue={estado} aria-label="Estado">
          <option value="">Cualquier estado</option>
          {isStore ? (
            <>
              <option value="disponible">Disponible</option>
              <option value="bajo">Stock bajo</option>
              <option value="agotado">Agotado</option>
            </>
          ) : (
            conditions.map((c) => (
              <option key={c} value={c}>
                {conditionLabels[c]}
              </option>
            ))
          )}
        </select>
        <button type="submit" className="btn quiet">
          Filtrar
        </button>
        {filtering && (
          <Link href={`${base}/inventario`} className="btn quiet">
            Limpiar
          </Link>
        )}
      </form>

      <section className="panel flush">
        {tree.length === 0 ? (
          <p className="empty">
            {filtering ? (
              "Nada coincide con esos filtros."
            ) : can(ctx.role, "editar") ? (
              <>
                Todavía no hay {l.plural.toLowerCase()}. <Link href={`${base}/inventario/nuevo`}>Crea el primero.</Link>
              </>
            ) : (
              `Todavía no hay ${l.plural.toLowerCase()}.`
            )}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{l.singular.charAt(0).toUpperCase() + l.singular.slice(1)}</th>
                  <th>Categoría</th>
                  {isStore ? (
                    <>
                      <th>Existencias</th>
                      <th className="num">{l.qty}</th>
                      <th className="num">Precio</th>
                      <th>Estado</th>
                    </>
                  ) : (
                    <>
                      <th className="num">{l.qty}</th>
                      <th>Estado</th>
                      <th>Responsable</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {tree.map(({ item: p, depth }) => (
                  <tr key={p.id} className={depth ? "child-row" : undefined}>
                    <td>
                      <div className="cell-item">
                        <ItemThumb companyId={companyId} photo={p.photo} name={p.name} />
                        <span>
                          <Link href={`${base}/inventario/${p.id}`} className="strong">
                            {p.name}
                          </Link>
                          <span className="muted small block">
                            {p.code}
                            {brandModel(p) ? ` · ${brandModel(p)}` : ""}
                            {p.location ? ` · ${p.location}` : ""}
                            {childrenOf(items, p.id).length > 0
                              ? ` · ${childrenOf(items, p.id).length} variante${childrenOf(items, p.id).length === 1 ? "" : "s"}`
                              : ""}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>{catName.get(p.categoryId) ?? "Sin categoría"}</td>
                    {isStore ? (
                      <>
                        <td className="gauge-cell">
                          <StockGauge stock={p.stock} min={p.minStock} />
                        </td>
                        <td className="num">
                          {formatNumber(totalStock(items, p))} {p.unit}
                        </td>
                        <td className="num">{childrenOf(items, p.id).length > 0 && !p.price ? <span className="muted">—</span> : formatMoney(p.price)}</td>
                        <td>
                          <StatusBadge stock={p.stock} min={p.minStock} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="num">
                          {formatNumber(totalStock(items, p))} {p.unit}
                        </td>
                        <td>
                          <ConditionBadge condition={p.condition} />
                        </td>
                        <td>{p.responsible || <span className="muted">—</span>}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="muted small">
        {rows.length} de {items.length} {l.plural.toLowerCase()}
      </p>
    </>
  );
}
