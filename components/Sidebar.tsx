"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import ThemeToggle from "./ThemeToggle";
import UserAvatar, { type AvatarUser } from "./UserAvatar";

type Props = {
  companyId: string;
  companyName: string;
  typeName: string;
  roleLabel: string;
  user: AvatarUser;
  nav: { href: string; label: string }[];
  exportHref: string;
};

// Barra lateral de navegación de la empresa
export default function Sidebar({ companyId, companyName, typeName, roleLabel, user, nav, exportHref }: Props) {
  const pathname = usePathname();
  const root = `/e/${companyId}`;
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">{companyName}</div>
        <div className="side-meta">
          {typeName} · {roleLabel}
        </div>
      </div>
      {/* Menú principal de secciones */}
      <nav aria-label="Principal">
        {nav.map((item) => {
          const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "nav-link active" : "nav-link"}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      {/* Pie de la barra: exportar, cambiar empresa y cerrar sesión */}
      <div className="side-foot">
        <a className="nav-link export" href={exportHref}>
          Descargar CSV
        </a>
        <Link href="/empresas" className="nav-link">
          Cambiar de empresa
        </Link>
        <Link href="/cuenta" className="nav-link">
          Mi cuenta
        </Link>
        <ThemeToggle />
        <div className="side-user">
          <span className="user-identity side-meta"><UserAvatar user={user} />{user.name}</span>
          <form action={logout}>
            <button type="submit" className="link-btn">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
