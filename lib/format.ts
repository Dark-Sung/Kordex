// Formateadores de moneda y números en español colombiano
const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("es-CO");

// Formatea un número como pesos colombianos
export const formatMoney = (n: number) => money.format(n);

// Formatea un número con separadores de miles
export const formatNumber = (n: number) => number.format(n);

// Formatea una fecha ISO como fecha y hora corta en zona horaria de Bogotá
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

// Formatea una fecha ISO como solo la fecha (sin hora)
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" });
}

// Formatea un delta de stock con signo (+ o -)
export function formatDelta(n: number): string {
  return n > 0 ? `+${number.format(n)}` : number.format(n);
}
