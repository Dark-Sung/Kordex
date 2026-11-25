import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmMaintenance } from "@/app/actions/items";
import ActionForm from "@/components/ActionForm";
import ChangeList from "@/components/ChangeList";
import ItemThumb from "@/components/ItemThumb";
import MaintenanceBadge from "@/components/MaintenanceBadge";
import { loadCompanyData } from "@/lib/company-data";
import { brandModel } from "@/lib/hierarchy";
import { formatDate, formatDay, formatNumber } from "@/lib/format";
import { dueInfo, dueText, intervalText } from "@/lib/maintenance";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const LIMIT = 200;

export default async function MantenimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ tipo?: string; elemento?: string }>;
}) {
  const { companyId } = await params;
  const { tipo = "", elemento = "" } = await searchParams;
  const { ctx, items, maintenance, people } = await loadCompanyData(companyId);
  // Esta sección existe solo en inventarios de organización.
  if (ctx.company.type !== "organizacion") redirect(`/e/${companyId}/movimientos`);

  const base = `/e/${companyId}`;
  const canDo = can(ctx.role, "mantener");
  const canEdit = can(ctx.role, "editar");
  const itemById = new Map(items.map((i) => [i.id, i]));

  const planned = items
    .map((item) => ({ item, ...dueInfo(item) }))
    .filter((r) => r.state !== "none")
    .sort((a, b) => a.due!.getTime() - b.due!.getTime());
  const overdue = planned.filter((r) => r.state === "overdue").length;
  const soon = planned.filter((r) => r.state === "soon").length;
  const noPlan = items.length - planned.length;

  const history = maintenance
    .filter((m) => (!tipo || m.kind === tipo) && (!elemento || m.itemId === elemento))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = history.slice(0, LIMIT);
  const filtering = Boolean(tipo || elemento);

  return (
    <>
      <header className="page-head">
        <h1>Mantenimiento</h1>
      </header>

      <section className="figures" aria-label="Resumen de mantenimientos">
        <div>
          <dt>Vencidos</dt>
          <dd>{formatNumber(overdue)}</dd>
        </div>
        <div>
          <dt>Próximos (7 días)</dt>
          <dd>{formatNumber(soon)}</dd>
        </div>
        <div>
          <dt>Al día</dt>
          <dd>{formatNumber(planned.length - overdue - soon)}</dd>
        </div>
        <div>
          <dt>Sin plan</dt>
          <dd>{formatNumber(noPlan)}</dd>
        </div>
      </section>

      <section className="panel flush">
        <div className="panel-head padded">
          <h2>Plan de mantenimiento</h2>
          <span className="muted">Los más urgentes primero</span>
        </div>
        {planned.length === 0 ? (
          <p className="empty">
            Ningún elemento tiene mantenimiento programado. Defínelo en la ficha del elemento, en «Mantenimiento
            periódico».
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Elemento</th>
                  <th>Frecuencia</th>
                  <th>Último</th>
                  <th>Próximo</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {planned.map(({ item, state, due, days }) => (
                  <tr key={item.id}>
                    <td>
                      <div className="cell-item">
                        <ItemThumb companyId={companyId} photo={item.photo} name={item.name} />
                        <span>
                          <Link href={`${base}/inventario/${item.id}`} className="strong">
                            {item.name}
                          </Link>
                          <span className="muted small block">
                            {item.code}
                            {brandModel(item) ? ` · ${brandModel(item)}` : ""}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td>{intervalText(item.maintenanceEveryDays)}</td>
                    <td>{item.lastMaintenanceAt ? formatDay(item.lastMaintenanceAt) : <span className="muted">Nunca</span>}</td>
                    <td>
                      {formatDay(due!.toISOString())}
                      <span className="muted small block">{dueText(days)}</span>
                    </td>
                    <td>
                      <MaintenanceBadge state={state} />
                    </td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        {canDo && (
                          <ActionForm
                            action={confirmMaintenance.bind(null, companyId, item.id)}
                            submitLabel="Marcar hecho"
                            variant={state === "ok" ? "quiet" : "primary"}
                            className="inline-form"
                          />
                        )}
                        {canEdit && (
                          <Link href={`${base}/inventario/${item.id}#datos`} className="btn quiet">
                            Modificar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel flush">
        <div className="panel-head padded">
          <h2>Historial de mantenimientos y cambios</h2>
          <span className="muted">{history.length} registro{history.length === 1 ? "" : "s"}</span>
        </div>
        <form method="get" className="filters padded">
          <select name="tipo" defaultValue={tipo} aria-label="Tipo">
            <option value="">Mantenimientos y cambios</option>
            <option value="mantenimiento">Solo mantenimientos</option>
            <option value="cambio">Solo cambios</option>
          </select>
          <select name="elemento" defaultValue={elemento} aria-label="Elemento">
            <option value="">Todos los elementos</option>
            {[...items]
              .sort((a, b) => a.name.localeCompare(b.name, "es"))
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.brand ? ` (${i.brand})` : ""}
                </option>
              ))}
          </select>
          <button type="submit" className="btn quiet">
            Filtrar
          </button>
          {filtering && (
            <Link href={`${base}/mantenimiento`} className="btn quiet">
              Limpiar
            </Link>
          )}
        </form>
        {rows.length === 0 ? (
          <p className="empty">
            {filtering
              ? "Nada coincide con esos filtros."
              : "Aún no hay mantenimientos ni cambios. Se anotan solos al modificar un elemento o al confirmar un mantenimiento."}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Elemento</th>
                  <th>Tipo</th>
                  <th>Detalle</th>
                  <th>Registró</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const it = itemById.get(m.itemId);
                  return (
                    <tr key={m.id}>
                      <td>{formatDate(m.createdAt)}</td>
                      <td>
                        {it ? (
                          <Link href={`${base}/inventario/${it.id}`}>{it.name}</Link>
                        ) : (
                          <span className="muted">Elemento eliminado</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${m.kind === "mantenimiento" ? "ok" : "neutral"}`}>
                          {m.kind === "mantenimiento" ? "Mantenimiento" : "Cambio"}
                        </span>
                      </td>
                      <td>
                        {m.note || (m.changes.length === 0 ? <span className="muted">—</span> : null)}
                        <ChangeList changes={m.changes} />
                      </td>
                      <td>{people.get(m.userId)?.name ?? <span className="muted">Cuenta eliminada</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {history.length > LIMIT && (
        <p className="muted small">
          Se muestran los {LIMIT} más recientes de {history.length}.
        </p>
      )}
    </>
  );
}
