import { addMember, changeMemberRole, removeMember } from "@/app/actions/members";
import ActionForm from "@/components/ActionForm";
import UserAvatar from "@/components/UserAvatar";
import { loadCompanyData } from "@/lib/company-data";
import { formatDay } from "@/lib/format";
import { assignableRoles, can, canManageMember, roleDescriptions, roleLabels, roles } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function EquipoPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { ctx, memberships, people } = await loadCompanyData(companyId);
  const manage = can(ctx.role, "miembros");
  const assignable = assignableRoles(ctx.role);

  const rows = memberships
    .map((m) => ({ m, person: people.get(m.userId) }))
    .filter((x): x is typeof x & { person: NonNullable<typeof x.person> } => x.person !== undefined)
    .sort((a, b) => a.person.name.localeCompare(b.person.name, "es"));

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Equipo</h1>
          <p className="muted">Quién tiene acceso a {ctx.company.name} y con qué rol.</p>
        </div>
      </header>

      <section className="panel flush">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Rol</th>
                <th>Desde</th>
                {manage && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, person }) => {
                const editable = manage && person.id !== ctx.user.id && canManageMember(ctx.role, m.role);
                return (
                  <tr key={person.id}>
                    <td>
                      <div className="user-identity">
                        <UserAvatar user={person} />
                        <div>
                          <span className="strong">{person.name}</span>
                          {person.id === ctx.user.id && <span className="muted small"> (tú)</span>}
                          <div className="muted small">{person.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {editable ? (
                        <ActionForm
                          action={changeMemberRole.bind(null, companyId, person.id)}
                          submitLabel="Cambiar"
                          variant="quiet"
                          className="row-form"
                        >
                          <select name="role" defaultValue={m.role} aria-label={`Rol de ${person.name}`}>
                            {assignable.map((r) => (
                              <option key={r} value={r}>
                                {roleLabels[r]}
                              </option>
                            ))}
                          </select>
                        </ActionForm>
                      ) : (
                        roleLabels[m.role]
                      )}
                    </td>
                    <td>{formatDay(m.createdAt)}</td>
                    {manage && (
                      <td>
                        {editable ? (
                          <ActionForm
                            action={removeMember.bind(null, companyId, person.id)}
                            submitLabel="Quitar"
                            variant="quiet"
                            confirmMessage={`¿Quitar a ${person.name} de la empresa?`}
                            className="row-form"
                          />
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-col">
        {manage && (
          <section className="panel">
            <div className="panel-head">
              <h2>Agregar a alguien</h2>
            </div>
            <p className="muted small spaced">
              La persona debe tener una cuenta creada. Escribe el correo con el que se registró.
            </p>
            <ActionForm action={addMember.bind(null, companyId)} submitLabel="Agregar al equipo" resetOnSuccess>
              <div className="fields single">
                <label className="field">
                  <span>Correo de la cuenta</span>
                  <input name="email" type="email" required />
                </label>
                <label className="field">
                  <span>Rol</span>
                  <select name="role" defaultValue="operador">
                    {assignable.map((r) => (
                      <option key={r} value={r}>
                        {roleLabels[r]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </ActionForm>
          </section>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>Qué puede hacer cada rol</h2>
          </div>
          <dl className="details">
            {roles.map((r) => (
              <div key={r} className="role-row">
                <dt>{roleLabels[r]}</dt>
                <dd>{roleDescriptions[r]}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
