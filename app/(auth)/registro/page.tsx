import Link from "next/link";
import { register } from "@/app/actions/auth";
import ActionForm from "@/components/ActionForm";

export default function RegistroPage() {
  return (
    <>
      <h1>Crear cuenta</h1>
      <p className="muted auth-sub">Después podrás crear una empresa o unirte a una que ya exista.</p>
      <ActionForm action={register} submitLabel="Crear cuenta" fullWidthButton>
        <div className="fields single">
          <label className="field">
            <span>Nombre</span>
            <input name="name" autoComplete="name" required maxLength={80} />
          </label>
          <label className="field">
            <span>Correo</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            <small>Mínimo 8 caracteres, con letras y números.</small>
          </label>
          <label className="field">
            <span>Repite la contraseña</span>
            <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
          </label>
        </div>
      </ActionForm>
      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link href="/iniciar-sesion">Iniciar sesión</Link>
      </p>
    </>
  );
}
