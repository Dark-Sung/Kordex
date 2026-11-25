import type { Role } from "./types";

// Acciones posibles dentro de una empresa
export type Action = "editar" | "mover" | "mantener" | "eliminar" | "categorias" | "miembros" | "empresa";

// Jerarquía numérica de roles para comparar rangos fácilmente
export const roleRank: Record<Role, number> = {
  consulta: 0,
  operador: 1,
  administrador: 2,
  propietario: 3,
};

// Lista ordenada de roles de mayor a menor
export const roles: Role[] = ["propietario", "administrador", "operador", "consulta"];

// Etiquetas visibles de cada rol
export const roleLabels: Record<Role, string> = {
  propietario: "Propietario",
  administrador: "Administrador",
  operador: "Operador",
  consulta: "Solo consulta",
};

// Descripciones de qué puede hacer cada rol
export const roleDescriptions: Record<Role, string> = {
  propietario: "Control total: equipo, ajustes de la empresa y eliminarla.",
  administrador: "Gestiona inventario, categorías y el equipo (operadores y consulta).",
  operador: "Crea y edita registros, anota movimientos y confirma mantenimientos. No elimina.",
  consulta: "Solo puede ver el inventario y descargarlo.",
};

// Verifica si un rol tiene permiso para ejecutar una acción
export function can(role: Role, action: Action): boolean {
  switch (action) {
    case "editar":
    case "mover":
    case "mantener":
      return roleRank[role] >= roleRank.operador;
    case "eliminar":
    case "categorias":
    case "miembros":
      return roleRank[role] >= roleRank.administrador;
    case "empresa":
      return role === "propietario";
  }
}

// Devuelve los roles que el actor puede asignar a otras personas
export function assignableRoles(actor: Role): Role[] {
  if (actor === "propietario") return roles;
  if (actor === "administrador") return ["operador", "consulta"];
  return [];
}

// Verifica si el actor puede modificar o quitar a alguien con el rol indicado
export function canManageMember(actor: Role, target: Role): boolean {
  if (actor === "propietario") return true;
  return roleRank[actor] >= roleRank.administrador && roleRank[actor] > roleRank[target];
}
