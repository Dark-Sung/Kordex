import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmMaintenance, deleteItem, registerMaintenance, registerMovement, updateItem } from "@/app/actions/items";
import ActionForm from "@/components/ActionForm";
import ChangeList from "@/components/ChangeList";
import ItemFields from "@/components/ItemFields";
import ItemThumb from "@/components/ItemThumb";
import MaintenanceBadge from "@/components/MaintenanceBadge";
import StockGauge from "@/components/StockGauge";
import { ConditionBadge, StatusBadge } from "@/components/StatusBadge";
import { loadCompanyData } from "@/lib/company-data";
import { formatDate, formatDay, formatDelta, formatMoney, formatNumber } from "@/lib/format";
import { brandModel, childrenOf, totalStock } from "@/lib/hierarchy";
import { dueInfo, dueText, intervalText } from "@/lib/maintenance";
import { can } from "@/lib/permissions";
import { photoUrl } from "@/lib/photos";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ companyId: string; itemId: string }> }) {
  const { companyId, itemId } = await params;
  const { ctx, l, categories, items, movements, maintenance, people } = await loadCompanyData(companyId);
  const item = items.find((i) => i.id === itemId);
  if (!item) notFound();

  const isStore = ctx.company.type === "tienda";
  const base = `/e/${companyId}`;
  const category = categories.find((c) => c.id === item.categoryId);
  const parent = item.parentId ? items.find((i) => i.id === item.parentId) : undefined;
  const children = childrenOf(items, item.id).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const isGroup = children.length > 0;
  const total = totalStock(items, item);
  const history = movements
    .filter((m) => m.itemId === itemId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const log = maintenance
    .filter((m) => m.itemId === itemId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const due = dueInfo(item);
  const url = photoUrl(companyId, item.photo);
  const bm = brandModel(item);

  return (
    <>
      <header className="page-head">
        <div className="head-item">
          <ItemThumb companyId={companyId} photo={item.photo} name={item.name} size={56} />
          <div>
            <h1>{item.name}</h1>
            <p className="muted">
              {item.code} · {category?.name ?? "Sin categoría"}
              {bm ? ` · ${bm}` : ""}
              {item.location ? ` · ${item.location}` : ""}
            </p>
            {parent && (
              <p className="muted small">
                Variante de <Link href={`${base}/inventario/${parent.id}`}>{parent.name}</Link>
              </p>
            )}
          </div>
        </div>
        <Link href={parent ? `${base}/inventario/${parent.id}` : `${base}/inventario`} className="btn quiet">
          Volver
        </Link>
      </header>

      <section className="panel stock-summary">
        <div>
          <span className="muted small">{isGroup ? `${isStore ? "Existencias" : l.qty} totales` : isStore ? "Existencias" : l.qty}</span>
          <div className="big">
            {formatNumber(total)} <span className="unit">{item.unit}</span>
          </div>
          {isGroup && (
            <span className="muted small">
              {children.length} variante{children.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {isStore ? (
          <>
            <div className="grow">
              <StockGauge stock={item.stock} min={item.minStock} />
              <div className="muted small">Mínimo: {formatNumber(item.minStock)}</div>
            </div>
            <StatusBadge stock={item.stock} min={item.minStock} />
            <div>
              <span className="muted small">Valor a costo</span>
              <div className="strong">{formatMoney(item.stock * item.cost)}</div>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="muted small">Estado</span>
              <div>
                <ConditionBadge condition={item.condition} />
              </div>
            </div>
            <div>
              <span className="muted small">Responsable</span>
              <div className="strong">{item.responsible || "—"}</div>
            </div>
            <div>
              <span className="muted small">Mantenimiento</span>
              <div>
                <MaintenanceBadge state={due.state} />
              </div>
            </div>
          </>
        )}
      </section>

      {url && (
        <section className="panel photo-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Foto de ${item.name}`} />
        </section>
      )}

      {/* ---------- Variantes (hijos) ---------- */}
      {!parent && (
        <section className="panel flush">
          <div className="panel-head padded">
            <h2>Variantes</h2>
            {can(ctx.role, "editar") && (
              <Link href={`${base}/inventario/nuevo?padre=${item.id}`} className="btn primary">
                Agregar variante
              </Link>
            )}
          </div>
          {children.length === 0 ? (
            <p className="empty">
              Este {l.singular} no tiene variantes. Agrégalas si existe en distintos modelos o marcas (por ejemplo, varios
              televisores).
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Variante</th>
                    <th>Marca · Modelo</th>
                    <th className="num">{l.qty}</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {children.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="cell-item">
                          <ItemThumb companyId={companyId} photo={c.photo} name={c.name} />
                          <span>
                            <Link href={`${base}/inventario/${c.id}`} className="strong">
                              {c.name}
                            </Link>
                            <span className="muted small block">{c.code}</span>
                          </span>
                        </div>
                      </td>
                      <td>{brandModel(c) || <span className="muted">—</span>}</td>
                      <td className="num">
                        {formatNumber(c.stock)} {c.unit}
                      </td>
                      <td>{isStore ? <StatusBadge stock={c.stock} min={c.minStock} /> : <ConditionBadge condition={c.condition} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <div className="two-col">
        {/* ---------- Tienda: movimientos de cantidad ---------- */}
        {isStore && can(ctx.role, "mover") && (
          <section className="panel">
            <div className="panel-head">
              <h2>Registrar movimiento</h2>
            </div>
            <ActionForm
              action={registerMovement.bind(null, companyId, item.id)}
              submitLabel="Registrar movimiento"
              resetOnSuccess
            >
              <div className="fields">
                <label className="field">
                  <span>Tipo</span>
                  <select name="type" defaultValue="entrada">
                    <option value="entrada">{l.moveOption.entrada}</option>
                    <option value="salida">{l.moveOption.salida}</option>
                    <option value="ajuste">{l.moveOption.ajuste}</option>
                  </select>
                </label>
                <label className="field">
                  <span>Cantidad</span>
                  <input name="quantity" type="number" min="0" step="1" required />
                  <small>En un ajuste, escribe la cantidad contada.</small>
                </label>
                <label className="field wide">
                  <span>Nota</span>
                  <input name="note" maxLength={160} placeholder={l.notePlaceholder} />
                </label>
              </div>
            </ActionForm>
          </section>
        )}

        {/* ---------- Organización: mantenimiento ---------- */}
        {!isStore && (
          <section className="panel">
            <div className="panel-head">
              <h2>Mantenimiento</h2>
              <MaintenanceBadge state={due.state} />
            </div>
            <dl className="details">
              <dt>Frecuencia</dt>
              <dd>{intervalText(item.maintenanceEveryDays)}</dd>
              <dt>Último</dt>
              <dd>{item.lastMaintenanceAt ? formatDay(item.lastMaintenanceAt) : "Nunca"}</dd>
              {due.due && (
                <>
                  <dt>Próximo</dt>
                  <dd>
                    {formatDay(due.due.toISOString())} <span className="muted">({dueText(due.days)})</span>
                  </dd>
                </>
              )}
            </dl>
            {can(ctx.role, "mantener") && (
              <>
                <ActionForm
                  action={confirmMaintenance.bind(null, companyId, item.id)}
                  submitLabel="Marcar mantenimiento como hecho"
                  className="spaced-top"
                />
                <hr className="sep" />
                <ActionForm
                  action={registerMaintenance.bind(null, companyId, item.id)}
                  submitLabel="Anotar"
                  variant="quiet"
                  resetOnSuccess
                >
                  <div className="fields">
                    <label className="field">
                      <span>Qué se hizo</span>
                      <select name="kind" defaultValue="mantenimiento">
                        <option value="mantenimiento">Mantenimiento (reinicia el plazo)</option>
                        <option value="cambio">Cambio o reparación</option>
                      </select>
                    </label>
                    <label className="field wide">
                      <span>Detalle</span>
                      <input name="note" required maxLength={300} placeholder="Cambio de lámpara, limpieza de filtros…" />
                    </label>
                  </div>
                </ActionForm>
              </>
            )}
          </section>
        )}

        <section className="panel" id="datos">
          <div className="panel-head">
            <h2>Datos</h2>
          </div>
          {can(ctx.role, "editar") ? (
            <ActionForm action={updateItem.bind(null, companyId, item.id)} submitLabel="Guardar cambios">
              <ItemFields type={ctx.company.type} companyId={companyId} categories={categories} item={item} />
            </ActionForm>
          ) : (
            <dl className="details">
              <dt>{l.code}</dt>
              <dd>{item.code}</dd>
              <dt>Categoría</dt>
              <dd>{category?.name ?? "—"}</dd>
              <dt>Marca · Modelo</dt>
              <dd>{bm || "—"}</dd>
              <dt>Ubicación</dt>
              <dd>{item.location || "—"}</dd>
              {isStore ? (
                <>
                  <dt>Costo</dt>
                  <dd>{formatMoney(item.cost)}</dd>
                  <dt>Precio de venta</dt>
                  <dd>{formatMoney(item.price)}</dd>
                </>
              ) : (
                <>
                  <dt>Número de serie</dt>
                  <dd>{item.serial || "—"}</dd>
                  <dt>Notas</dt>
                  <dd>{item.notes || "—"}</dd>
                </>
              )}
            </dl>
          )}
        </section>
      </div>

      {/* ---------- Historial ---------- */}
      {isStore ? (
        <section className="panel flush">
          <div className="panel-head padded">
            <h2>Historial</h2>
            <span className="muted">{history.length} movimientos</span>
          </div>
          {history.length === 0 ? (
            <p className="empty">Todavía no hay movimientos.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th className="num">Cambio</th>
                    <th className="num">Resultante</th>
                    <th>Registró</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDate(m.createdAt)}</td>
                      <td>{l.move[m.type]}</td>
                      <td className="num">
                        <span className={`delta ${m.delta >= 0 ? "plus" : "minus"}`}>{formatDelta(m.delta)}</span>
                      </td>
                      <td className="num">{formatNumber(m.stockAfter)}</td>
                      <td>{people.get(m.userId)?.name ?? <span className="muted">Cuenta eliminada</span>}</td>
                      <td>{m.note || <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="panel flush">
          <div className="panel-head padded">
            <h2>Historial de mantenimientos y cambios</h2>
            <span className="muted">{log.length} registro{log.length === 1 ? "" : "s"}</span>
          </div>
          {log.length === 0 ? (
            <p className="empty">Todavía no hay mantenimientos ni cambios.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Detalle</th>
                    <th>Registró</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDate(m.createdAt)}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {can(ctx.role, "eliminar") && (
        <section className="panel danger-zone">
          <div>
            <h2>Eliminar {l.singular}</h2>
            <p className="muted">
              {isGroup
                ? "Primero elimina sus variantes."
                : "Se borra el registro, su foto y todo su historial. No se puede deshacer."}
            </p>
          </div>
          <ActionForm
            action={deleteItem.bind(null, companyId, item.id)}
            submitLabel={`Eliminar ${l.singular}`}
            variant="danger"
            confirmMessage={`¿Eliminar «${item.name}» y su historial?`}
          />
        </section>
      )}
    </>
  );
}
