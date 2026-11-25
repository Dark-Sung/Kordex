import { deleteCompany, renameCompany } from "@/app/actions/companies";
import { leaveCompany } from "@/app/actions/members";
import ActionForm from "@/components/ActionForm";
import { loadCompanyData } from "@/lib/company-data";
import { formatDay } from "@/lib/format";
import { typeInfo } from "@/lib/labels";
import { can, roleLabels } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AjustesPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { ctx } = await loadCompanyData(companyId);
  const owner = can(ctx.role, "empresa");

  return (
    <>
      <header className="page-head">
        <h1>Ajustes</h1>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2>Empresa</h2>
        </div>
        <dl className="details">
          <dt>Tipo de inventario</dt>
          <dd>
            {typeInfo[ctx.company.type].name}
            <span className="muted small block">{typeInfo[ctx.company.type].description}</span>
          </dd>
          <dt>Creada</dt>
          <dd>{formatDay(ctx.company.createdAt)}</dd>
          <dt>Tu rol</dt>
          <dd>{roleLabels[ctx.role]}</dd>
        </dl>
        {owner && (
          <ActionForm action={renameCompany.bind(null, companyId)} submitLabel="Guardar nombre" className="spaced-top">
            <label className="field">
              <span>Nombre de la empresa</span>
              <input name="name" defaultValue={ctx.company.name} required minLength={2} maxLength={80} />
            </label>
          </ActionForm>
        )}
      </section>

      <section className="panel danger-zone">
        <div>
          <h2>Salir de la empresa</h2>
          <p className="muted">Pierdes el acceso hasta que alguien te vuelva a agregar.</p>
        </div>
        <ActionForm
          action={leaveCompany.bind(null, companyId)}
          submitLabel="Salir de la empresa"
          variant="quiet"
          confirmMessage={`¿Salir de ${ctx.company.name}?`}
        />
      </section>

      {owner && (
        <section className="panel danger-zone stacked">
          <div>
            <h2>Eliminar la empresa</h2>
            <p className="muted">
              Se borran el inventario, las fotos, los movimientos y el acceso de todo el equipo. No se puede deshacer.
            </p>
          </div>
          <ActionForm
            action={deleteCompany.bind(null, companyId)}
            submitLabel="Eliminar la empresa"
            variant="danger"
            confirmMessage={`¿Eliminar definitivamente «${ctx.company.name}»?`}
          >
            <label className="field">
              <span>Escribe «{ctx.company.name}» para confirmar</span>
              <input name="confirmName" autoComplete="off" required />
            </label>
          </ActionForm>
        </section>
      )}
    </>
  );
}
