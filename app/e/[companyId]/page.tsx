import Link from "next/link";
import ItemThumb from "@/components/ItemThumb";
import StockGauge from "@/components/StockGauge";
import { ConditionBadge } from "@/components/StatusBadge";
import ChangeList from "@/components/ChangeList";
import MaintenanceBadge from "@/components/MaintenanceBadge";
import { loadCompanyData } from "@/lib/company-data";
import { dueInfo, dueText } from "@/lib/maintenance";
import { formatDate, formatDelta, formatMoney, formatNumber } from "@/lib/format";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ResumenPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { ctx, l, categories, items, movements, maintenance } = await loadCompanyData(companyId);
  const base = `/e/${companyId}`;
  const isStore = ctx.company.type === "tienda";
  const itemById = new Map(items.map((i) => [i.id, i]));

  const units = items.reduce((s, i) => s + i.stock, 0);
  const recent = [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  const byCategory = categories
    .map((c) => {
      const inCat = items.filter((i) => i.categoryId === c.id);
      return {
        name: c.name,
        value: isStore ? inCat.reduce((s, i) => s + i.stock * i.cost, 0) : inCat.reduce((s, i) => s + i.stock, 0),
      };
    })
    .sort((a, b) => b.value - a.value);
  const maxCat = Math.max(...byCategory.map((c) => c.value), 1);

  // Un registro con variantes es solo la agrupación: se evalúan sus variantes.
  const groupIds = new Set(items.filter((i) => i.parentId).map((i) => i.parentId));
  const reorder = items
    .filter((i) => !groupIds.has(i.id) && i.stock <= i.minStock)
    .sort((a, b) => a.stock - a.minStock - (b.stock - b.minStock));
  const attention = items.filter((i) => i.condition === "danado" || i.condition === "reparacion");
  const dueSoon = items
    .map((item) => ({ item, ...dueInfo(item) }))
    .filter((r) => r.state === "overdue" || r.state === "soon")
    .sort((a, b) => a.due!.getTime() - b.due!.getTime());
  const recentLog = [...maintenance].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const good = items.filter((i) => i.condition === "nuevo" || i.condition === "bueno").length;

  return (
    <>
      <header className="page-head">
        <h1>Resumen</h1>
        {can(ctx.role, "editar") && (
          <Link href={`${base}/inventario/nuevo`} className="btn primary">
            {l.newItem}
          </Link>
        )}
      </header>

      <section className="figures" aria-label="Cifras del inventario">
        <div>
          <dt>{l.plural}</dt>
          <dd>{formatNumber(items.length)}</dd>
        </div>
        <div>
          <dt>{isStore ? "Unidades en bodega" : "Unidades en total"}</dt>
          <dd>{formatNumber(units)}</dd>
        </div>
        {isStore ? (
          <>
            <div>
              <dt>Valor a costo</dt>
              <dd>{formatMoney(items.reduce((s, i) => s + i.stock * i.cost, 0))}</dd>
            </div>
            <div>
              <dt>Valor a precio de venta</dt>
              <dd>{formatMoney(items.reduce((s, i) => s + i.stock * i.price, 0))}</dd>
            </div>
          </>
        ) : (
          <>
            <div>
              <dt>En buen estado</dt>
              <dd>{formatNumber(good)}</dd>
            </div>
            <div>
              <dt>Requieren atención</dt>
              <dd>{formatNumber(attention.length)}</dd>
            </div>
            <div>
              <dt>Mantenimientos pendientes</dt>
              <dd>{formatNumber(dueSoon.length)}</dd>
            </div>
          </>
        )}
      </section>

      {isStore ? (
        <section className="panel">
          <div className="panel-head">
            <h2>Por reponer</h2>
            <span className="muted">
              {reorder.length === 0
                ? "Todo está sobre el mínimo"
                : `${reorder.length} producto${reorder.length === 1 ? "" : "s"} en o bajo el mínimo`}
            </span>
          </div>
          {reorder.length === 0 ? (
            <p className="empty">Ningún producto necesita reposición por ahora.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Existencias</th>
                    <th className="num">Stock</th>
                    <th className="num">Mínimo</th>
                    <th className="num">Faltan</th>
                  </tr>
                </thead>
                <tbody>
                  {reorder.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-item">
                          <ItemThumb companyId={companyId} photo={p.photo} name={p.name} />
                          <span>
                            <Link href={`${base}/inventario/${p.id}`} className="strong">
                              {p.name}
                            </Link>
                            <span className="muted small block">{p.code}</span>
                          </span>
                        </div>
                      </td>
                      <td className="gauge-cell">
                        <StockGauge stock={p.stock} min={p.minStock} />
                      </td>
                      <td className="num">
                        {formatNumber(p.stock)} {p.unit}
                      </td>
                      <td className="num">{formatNumber(p.minStock)}</td>
                      <td className="num strong">{formatNumber(Math.max(p.minStock - p.stock, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <div className="panel-head">
            <h2>Requieren atención</h2>
            <span className="muted">Elementos dañados o en reparación</span>
          </div>
          {attention.length === 0 ? (
            <p className="empty">Todos los elementos están en condiciones de uso.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Elemento</th>
                    <th>Estado</th>
                    <th>Ubicación</th>
                    <th>Responsable</th>
                    <th className="num">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {attention.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <div className="cell-item">
                          <ItemThumb companyId={companyId} photo={i.photo} name={i.name} />
                          <span>
                            <Link href={`${base}/inventario/${i.id}`} className="strong">
                              {i.name}
                            </Link>
                            <span className="muted small block">{i.code}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <ConditionBadge condition={i.condition} />
                      </td>
                      <td>{i.location || <span className="muted">—</span>}</td>
                      <td>{i.responsible || <span className="muted">—</span>}</td>
                      <td className="num">
                        {formatNumber(i.stock)} {i.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <div className="two-col">
        {isStore ? (
          <section className="panel">
          <div className="panel-head">
            <h2>Últimos movimientos</h2>
            <Link href={`${base}/movimientos`}>Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <p className="empty">Aún no hay movimientos.</p>
          ) : (
            <ul className="feed">
              {recent.map((m) => {
                const it = itemById.get(m.itemId);
                return (
                  <li key={m.id}>
                    <span className={`delta ${m.delta >= 0 ? "plus" : "minus"}`}>{formatDelta(m.delta)}</span>
                    <span>
                      {it ? <Link href={`${base}/inventario/${it.id}`}>{it.name}</Link> : "Registro eliminado"}
                      <span className="muted small block">
                        {l.move[m.type]} · {formatDate(m.createdAt)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          </section>

        ) : (
          <section className="panel">
            <div className="panel-head">
              <h2>Mantenimiento y cambios</h2>
              <Link href={`${base}/mantenimiento`}>Ver todo</Link>
            </div>
            {dueSoon.length > 0 && (
              <ul className="feed">
                {dueSoon.slice(0, 5).map(({ item, state, days }) => (
                  <li key={item.id}>
                    <MaintenanceBadge state={state} />
                    <span>
                      <Link href={`${base}/inventario/${item.id}`}>{item.name}</Link>
                      <span className="muted small block">Mantenimiento {dueText(days)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {recentLog.length === 0 ? (
              <p className="empty">Aún no hay mantenimientos ni cambios.</p>
            ) : (
              <ul className="feed">
                {recentLog.map((m) => {
                  const it = itemById.get(m.itemId);
                  return (
                    <li key={m.id}>
                      <span className={`badge ${m.kind === "mantenimiento" ? "ok" : "neutral"}`}>
                        {m.kind === "mantenimiento" ? "Mant." : "Cambio"}
                      </span>
                      <span>
                        {it ? <Link href={`${base}/inventario/${it.id}`}>{it.name}</Link> : "Elemento eliminado"}
                        <span className="muted small block">
                          {m.note || m.changes.map((c) => c.field).join(", ")} · {formatDate(m.createdAt)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>{isStore ? "Valor por categoría" : "Unidades por categoría"}</h2>
            {isStore && <span className="muted">a costo</span>}
          </div>
          {byCategory.length === 0 ? (
            <p className="empty">Crea una categoría para empezar.</p>
          ) : (
            <ul className="bars">
              {byCategory.map((c) => (
                <li key={c.name}>
                  <div className="bar-label">
                    <span>{c.name}</span>
                    <span className="num">{isStore ? formatMoney(c.value) : formatNumber(c.value)}</span>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${(c.value / maxCat) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
