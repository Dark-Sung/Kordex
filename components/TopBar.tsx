import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { SafeUser } from "@/lib/types";
import UserAvatar from "./UserAvatar";

// Barra superior con el nombre del usuario y el botón de cerrar sesión
export default function TopBar({ user }: { user: SafeUser }) {
  return (
    <header className="topbar">
      <Link href="/empresas" className="topbar-brand">
        Inventario
      </Link>
      <div className="topbar-user">
        <span className="user-identity muted"><UserAvatar user={user} />{user.name}</span>
        <Link href="/cuenta" className="link-btn dark">
          Mi cuenta
        </Link>
        <form action={logout}>
          <button type="submit" className="link-btn dark">
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
