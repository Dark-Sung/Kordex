import Link from "next/link";
import { redirect } from "next/navigation";
import { loadCompanyData } from "@/lib/company-data";
import { formatDate, formatDelta, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const LIMIT = 200;

export default async function MovimientosPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { companyId } = await params;
  const { tipo = "" } = await searchParams;
  const { ctx, l, items, movements, people } = await loadCompanyData(companyId);
  // Las organizaciones no llevan movimientos: tienen la sección de mantenimiento.
  if (ctx.company.type === "organizacion") redirect(`/e/${companyId}/mantenimiento`);
  const base = `/e/${companyId}`;
  const itemById = new Map(items.map((i) => [i.id, i]));

  const all = movements
    .filter((m) => !tipo || m.type === tipo)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = all.slice(0, LIMIT);

  return (
    <>
      <header className="page-head">
        <h1>Movimientos</h1>
      </header>

      <form method="get" className="filters">
        <select name="tipo" defaultValue={tipo} aria-label="Tipo de movimiento">
          <option value="">Todos los tipos</option>
          <option value="entrada">{l.move.entrada}s</option>
          <option value="salida">{l.move.salida}s</option>
          <option value="ajuste">{l.move.ajuste}s</option>
        </select>
        <button type="submit" className="btn quiet">
          Filtrar
        </button>
        {tipo && (
          <Link href={`${base}/movimientos`} className="btn quiet">
            Limpiar
          </Link>
        )}
      </form>

      <section className="panel flush">
        {rows.length === 0 ? (
          <p className="empty">
            No hay movimientos{tipo ? " de ese tipo" : ""}. Se registran desde la ficha de cada {l.singular}.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>{l.singular.charAt(0).toUpperCase() + l.singular.slice(1)}</th>
                  <th>Tipo</th>
                  <th className="num">Cambio</th>
                  <th className="num">Resultante</th>
                  <th>Registró</th>
                  <th>Nota</th>
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
                          <span className="muted">Registro eliminado</span>
                        )}
                      </td>
                      <td>{l.move[m.type]}</td>
                      <td className="num">
                        <span className={`delta ${m.delta >= 0 ? "plus" : "minus"}`}>{formatDelta(m.delta)}</span>
                      </td>
                      <td className="num">{formatNumber(m.stockAfter)}</td>
                      <td>{people.get(m.userId)?.name ?? <span className="muted">Cuenta eliminada</span>}</td>
                      <td>{m.note || <span className="muted">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {all.length > LIMIT && (
        <p className="muted small">
          Se muestran los {LIMIT} más recientes de {all.length}.
        </p>
      )}
    </>
  );
}
