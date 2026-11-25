import type { CompanyType, Condition, MovementType } from "./types";

// Nombre y descripción de cada tipo de empresa para mostrar al crear una
export const typeInfo: Record<CompanyType, { name: string; description: string }> = {
  tienda: {
    name: "Tienda",
    description:
      "Para negocios que venden productos: costo, precio de venta, stock mínimo y alertas de reposición.",
  },
  organizacion: {
    name: "Organización",
    description:
      "Para equipos que solo necesitan llevar el inventario de sus elementos de trabajo: cantidad, estado, ubicación y responsable.",
  },
};

// Tipo con todas las etiquetas que varían según el tipo de empresa
export type Labels = {
  singular: string;
  plural: string;
  newItem: string;
  code: string;
  qty: string;
  move: Record<MovementType, string>;
  moveOption: Record<MovementType, string>;
  notePlaceholder: string;
};

// Etiquetas para empresas de tipo tienda
const tienda: Labels = {
  singular: "producto",
  plural: "Productos",
  newItem: "Nuevo producto",
  code: "SKU",
  qty: "Stock",
  move: { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste" },
  moveOption: {
    entrada: "Entrada (compra, devolución)",
    salida: "Salida (venta, consumo)",
    ajuste: "Ajuste (conteo físico)",
  },
  notePlaceholder: "Factura 1042, merma, conteo de noviembre…",
};

// Etiquetas para empresas de tipo organización
const organizacion: Labels = {
  singular: "elemento",
  plural: "Elementos",
  newItem: "Nuevo elemento",
  code: "Código",
  qty: "Cantidad",
  move: { entrada: "Alta", salida: "Baja", ajuste: "Ajuste" },
  moveOption: {
    entrada: "Alta (compra, donación, devolución)",
    salida: "Baja (pérdida, descarte, préstamo)",
    ajuste: "Ajuste (conteo físico)",
  },
  notePlaceholder: "Donación recibida, equipo dado de baja, conteo anual…",
};

// Devuelve las etiquetas correctas según el tipo de empresa
export const labelsFor = (type: CompanyType): Labels => (type === "tienda" ? tienda : organizacion);

// Lista de condiciones posibles para elementos de organización
export const conditions: Condition[] = ["nuevo", "bueno", "regular", "reparacion", "danado"];

// Etiquetas visibles de cada condición
export const conditionLabels: Record<Condition, string> = {
  nuevo: "Nuevo",
  bueno: "Bueno",
  regular: "Regular",
  reparacion: "En reparación",
  danado: "Dañado",
};

// Tono visual de cada condición, reutiliza los colores de estado del stock
export const conditionTone: Record<Condition, "ok" | "low" | "out"> = {
  nuevo: "ok",
  bueno: "ok",
  regular: "low",
  reparacion: "low",
  danado: "out",
};
