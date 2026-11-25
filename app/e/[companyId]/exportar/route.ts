import { getContext } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { conditionLabels } from "@/lib/labels";
import { intervalText } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

function cell(value: string | number): string {
  const s = String(value);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const ctx = await getContext(companyId);
  if (!ctx) return new Response("No encontrado", { status: 404 });

  const db = await readDB();
  const catName = new Map(db.categories.filter((c) => c.companyId === companyId).map((c) => [c.id, c.name]));
  const items = db.items.filter((i) => i.companyId === companyId);
  const isStore = ctx.company.type === "tienda";
  const parentCode = new Map(items.map((i) => [i.id, i.code]));

  const header = isStore
    ? ["SKU", "Nombre", "Categoría", "Marca", "Modelo", "Variante de", "Unidad", "Costo", "Precio", "Stock", "Stock mínimo", "Ubicación"]
    : ["Código", "Nombre", "Categoría", "Marca", "Modelo", "Variante de", "Unidad", "Cantidad", "Estado", "Responsable", "Serial", "Ubicación", "Notas", "Mantenimiento", "Último mantenimiento"];

  const lines = items.map((p) =>
    (isStore
      ? [p.code, p.name, catName.get(p.categoryId) ?? "", p.brand, p.model, p.parentId ? (parentCode.get(p.parentId) ?? "") : "", p.unit, p.cost, p.price, p.stock, p.minStock, p.location]
      : [
          p.code,
          p.name,
          catName.get(p.categoryId) ?? "",
          p.brand,
          p.model,
          p.parentId ? (parentCode.get(p.parentId) ?? "") : "",
          p.unit,
          p.stock,
          p.condition ? conditionLabels[p.condition] : "",
          p.responsible,
          p.serial,
          p.location,
          p.notes,
          intervalText(p.maintenanceEveryDays),
          p.lastMaintenanceAt ? p.lastMaintenanceAt.slice(0, 10) : "",
        ]
    )
      .map(cell)
      .join(","),
  );

  // BOM para que Excel abra bien las tildes.
  const csv = "\uFEFF" + [header.map(cell).join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  const slug = ctx.company.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventario-${slug || "empresa"}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
