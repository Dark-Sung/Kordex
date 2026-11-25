import { changePassword, updateProfile, updateProfilePhoto } from "@/app/actions/auth";
import ActionForm from "@/components/ActionForm";
import PhotoField from "@/components/PhotoField";
import TopBar from "@/components/TopBar";
import { avatarUrl } from "@/components/UserAvatar";
import { requireUser } from "@/lib/auth";

export default async function CuentaPage() {
  const user = await requireUser();

  return (
    <>
      <TopBar user={user} />
      <main className="centered">
        <header className="page-head">
          <h1>Mi cuenta</h1>
        </header>
        <section className="panel">
          <ActionForm action={updateProfile} submitLabel="Guardar cambios">
            <div className="fields single">
              <label className="field">
                <span>Nombre</span>
                <input name="name" autoComplete="name" defaultValue={user.name} required minLength={2} maxLength={80} />
              </label>
              <label className="field">
                <span>Correo de inicio de sesión</span>
                <input name="email" type="email" autoComplete="username" defaultValue={user.email} required maxLength={120} />
              </label>
              <label className="field">
                <span>Contraseña actual</span>
                <input name="currentPassword" type="password" autoComplete="current-password" maxLength={200} aria-describedby="email-confirmation" />
                <small id="email-confirmation" className="muted">Solo se pide si cambias tu correo.</small>
              </label>
            </div>
          </ActionForm>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Foto de perfil</h2></div>
          <ActionForm action={updateProfilePhoto} submitLabel="Guardar foto">
            <PhotoField key={user.photo ?? "sin-foto"} currentUrl={avatarUrl(user)} label="Seleccionar foto de perfil" />
          </ActionForm>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Cambiar contraseña</h2></div>
          <ActionForm action={changePassword} submitLabel="Cambiar contraseña">
            <div className="fields single">
              <label className="field">
                <span>Contraseña actual</span>
                <input name="currentPassword" type="password" autoComplete="current-password" required maxLength={200} />
              </label>
              <label className="field">
                <span>Nueva contraseña</span>
                <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={200} />
              </label>
              <label className="field">
                <span>Confirmar nueva contraseña</span>
                <input name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={200} />
              </label>
            </div>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
