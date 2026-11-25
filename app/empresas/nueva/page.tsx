import Link from "next/link";
import { createCompany } from "@/app/actions/companies";
import ActionForm from "@/components/ActionForm";
import { typeInfo } from "@/lib/labels";
import type { CompanyType } from "@/lib/types";

export default function NuevaEmpresaPage() {
  const types: CompanyType[] = ["tienda", "organizacion"];
  return (
    <>
      <header className="page-head">
        <div>
          <h1>Registrar empresa</h1>
          <p className="muted">Quedarás como propietario y podrás agregar a tu equipo después.</p>
        </div>
        <Link href="/empresas" className="btn quiet">
          Volver
        </Link>
      </header>

      <section className="panel">
        <ActionForm action={createCompany} submitLabel="Registrar empresa">
          <div className="fields single">
            <label className="field">
              <span>Nombre de la empresa</span>
              <input name="name" required minLength={2} maxLength={80} />
            </label>
          </div>

          <fieldset className="type-options">
            <legend>¿Qué tipo de inventario necesita?</legend>
            {types.map((t, i) => (
              <label key={t} className="type-option">
                <input type="radio" name="type" value={t} defaultChecked={i === 0} />
                <span>
                  <span className="strong">{typeInfo[t].name}</span>
                  <span className="muted small block">{typeInfo[t].description}</span>
                </span>
              </label>
            ))}
            <p className="muted small">El tipo no se puede cambiar después de registrar la empresa.</p>
          </fieldset>
        </ActionForm>
      </section>
    </>
  );
}
