import Link from "next/link";
import { login } from "@/app/actions/auth";
import ActionForm from "@/components/ActionForm";

export default function IniciarSesionPage() {
  return (
    <>
      <h1>Iniciar sesión</h1>
      <p className="muted auth-sub">Entra con tu cuenta para ver el inventario de tus empresas.</p>
      <ActionForm action={login} submitLabel="Iniciar sesión" fullWidthButton>
        <div className="fields single">
          <label className="field">
            <span>Correo</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
        </div>
      </ActionForm>
      <p className="auth-switch">
        ¿No tienes cuenta? <Link href="/registro">Crear una cuenta</Link>
      </p>
    </>
  );
}
