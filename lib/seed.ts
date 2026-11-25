import { randomUUID } from "crypto";
import { hashPassword } from "./password";
import type { Category, Condition, DB, Item, MaintenanceRecord, Movement } from "./types";

// Base de datos vacía con todas las colecciones inicializadas
export const emptyDB = (): DB => ({
  users: [],
  sessions: [],
  loginAttempts: [],
  companies: [],
  memberships: [],
  categories: [],
  items: [],
  movements: [],
  maintenance: [],
});

// Genera una fecha ISO N días atrás desde ahora
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

// Datos de demostración para desarrollo
// Solo se cargan la primera vez que arranca la app fuera de producción
export async function seedDemo(): Promise<DB> {
  const db = emptyDB();
  const passwordHash = await hashPassword("demo1234");

  // Crea un usuario y lo agrega a la base
  const mkUser = (name: string, email: string) => {
    const u = { id: randomUUID(), name, email, passwordHash, createdAt: daysAgo(40) };
    db.users.push(u);
    return u;
  };
  const admin = mkUser("Ana Demo", "demo@inventario.local");
  const operador = mkUser("Luis Operador", "operador@inventario.local");

  // Crea una empresa con sus categorías
  const mkCompany = (name: string, type: "tienda" | "organizacion", cats: string[]) => {
    const c = { id: randomUUID(), name, type, createdAt: daysAgo(35) };
    db.companies.push(c);
    const categories: Category[] = cats.map((n) => ({ id: randomUUID(), companyId: c.id, name: n }));
    db.categories.push(...categories);
    return { company: c, cat: (n: string) => categories.find((x) => x.name === n)!.id };
  };

  // Crea un item con sus movimientos de entrada y salida opcionales
  const addItem = (
    companyId: string,
    userId: string,
    base: Partial<Item> & Pick<Item, "code" | "name" | "categoryId" | "unit" | "location">,
    stock: number,
    removed: number,
    withMovements = true,
  ): Item => {
    const item: Item = {
      id: randomUUID(),
      companyId,
      cost: 0,
      price: 0,
      minStock: 0,
      serial: "",
      responsible: "",
      notes: "",
      brand: "",
      model: "",
      ...base,
      stock,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(3),
    };
    db.items.push(item);
    if (!withMovements) return item;
    const initial = stock + removed;
    const moves: Movement[] = [
      {
        id: randomUUID(),
        companyId,
        itemId: item.id,
        type: "entrada",
        delta: initial,
        stockAfter: initial,
        note: "Cantidad inicial",
        userId,
        createdAt: daysAgo(30),
      },
    ];
    if (removed > 0) {
      moves.push({
        id: randomUUID(),
        companyId,
        itemId: item.id,
        type: "salida",
        delta: -removed,
        stockAfter: stock,
        note: "Salidas del mes",
        userId,
        createdAt: daysAgo(3),
      });
    }
    db.movements.push(...moves);
    return item;
  };

  // Empresa tipo tienda
  const tienda = mkCompany("Ferretería La Esquina", "tienda", ["Herramientas", "Eléctricos", "Papelería", "Limpieza"]);
  db.memberships.push(
    { userId: admin.id, companyId: tienda.company.id, role: "propietario", createdAt: daysAgo(35) },
    { userId: operador.id, companyId: tienda.company.id, role: "operador", createdAt: daysAgo(30) },
  );

  // Función abreviada para crear productos de tienda
  const t = (
    code: string,
    name: string,
    category: string,
    unit: string,
    cost: number,
    price: number,
    stock: number,
    minStock: number,
    location: string,
    sold: number,
    extra: Partial<Item> = {},
  ) =>
    addItem(
      tienda.company.id,
      admin.id,
      { code, name, categoryId: tienda.cat(category), unit, cost, price, minStock, location, ...extra },
      stock,
      sold,
    );
  t("HER-001", "Taladro percutor 650 W", "Herramientas", "und", 185000, 259000, 14, 5, "Estante A1", 6, {
    brand: "Bosch",
    model: "GSB 650",
  });
  t("HER-002", "Juego de destornilladores 12 piezas", "Herramientas", "und", 32000, 54900, 3, 8, "Estante A2", 15);
  t("ELE-001", "Cable THHN 12 AWG", "Eléctricos", "m", 2800, 4200, 420, 150, "Bodega B", 180);

  // Producto con variantes: el bombillo existe en varias potencias y marcas
  const bombillo = t("ELE-002", "Bombillo LED", "Eléctricos", "und", 0, 0, 0, 0, "Estante C3", 0);
  t("ELE-002-9W", "Bombillo LED 9 W", "Eléctricos", "und", 3900, 6500, 0, 40, "Estante C3", 120, {
    parentId: bombillo.id,
    brand: "Philips",
    model: "9 W luz fría",
  });
  t("ELE-002-12W", "Bombillo LED 12 W", "Eléctricos", "und", 5200, 8900, 55, 30, "Estante C3", 25, {
    parentId: bombillo.id,
    brand: "Sylvania",
    model: "12 W luz cálida",
  });
  t("PAP-001", "Resma de papel carta 75 g", "Papelería", "und", 11500, 16900, 62, 20, "Estante D1", 38);
  t("PAP-002", "Bolígrafo azul (caja x12)", "Papelería", "caja", 6800, 11000, 18, 10, "Estante D2", 7);
  t("LIM-001", "Desinfectante galón 3,8 L", "Limpieza", "und", 14500, 22000, 9, 12, "Bodega A", 21);
  t("LIM-002", "Guantes de nitrilo (caja x100)", "Limpieza", "caja", 24000, 38000, 31, 10, "Bodega A", 9);

  // Empresa tipo organización
  const org = mkCompany("Fundación Horizonte", "organizacion", [
    "Cómputo",
    "Mobiliario",
    "Audiovisual",
    "Herramientas",
    "Tecnología",
  ]);
  db.memberships.push(
    { userId: admin.id, companyId: org.company.id, role: "propietario", createdAt: daysAgo(35) },
    { userId: operador.id, companyId: org.company.id, role: "consulta", createdAt: daysAgo(30) },
  );

  // Función abreviada para crear elementos de organización
  const o = (
    code: string,
    name: string,
    category: string,
    quantity: number,
    condition: Condition,
    location: string,
    responsible: string,
    extra: Partial<Item> = {},
  ) =>
    addItem(
      org.company.id,
      admin.id,
      { code, name, categoryId: org.cat(category), unit: "und", condition, location, responsible, ...extra },
      quantity,
      0,
      false,
    );

  // Agrega un registro al historial de mantenimiento
  const maint = (item: Item, kind: "mantenimiento" | "cambio", note: string, ago: number, changes: MaintenanceRecord["changes"] = []) =>
    db.maintenance.push({
      id: randomUUID(),
      companyId: org.company.id,
      itemId: item.id,
      kind,
      note,
      changes,
      userId: admin.id,
      createdAt: daysAgo(ago),
    });

  const portatil = o("CMP-001", "Portátil Lenovo ThinkPad", "Cómputo", 6, "bueno", "Oficina principal", "Coordinación", {
    notes: "Compradas en 2024",
    brand: "Lenovo",
    model: "ThinkPad E14",
    maintenanceEveryDays: 180,
    lastMaintenanceAt: daysAgo(40),
  });
  maint(portatil, "mantenimiento", "Limpieza interna y actualización del sistema", 40);
  const proyector = o("CMP-002", "Proyector Epson", "Audiovisual", 1, "reparacion", "Sala de talleres", "Logística", {
    serial: "EP-77821",
    notes: "Lámpara en cambio",
    brand: "Epson",
    model: "PowerLite X49",
    maintenanceEveryDays: 90,
    lastMaintenanceAt: daysAgo(120),
  });
  maint(proyector, "mantenimiento", "Limpieza de filtros", 120);
  maint(proyector, "cambio", "Pasó a reparación", 6, [{ field: "Estado", from: "Bueno", to: "En reparación" }]);
  o("MOB-001", "Silla plegable", "Mobiliario", 80, "regular", "Bodega", "Logística");
  o("MOB-002", "Mesa de trabajo 1,8 m", "Mobiliario", 12, "bueno", "Sala de talleres", "Logística");
  const mic = o("AUD-001", "Micrófono inalámbrico", "Audiovisual", 3, "danado", "Oficina principal", "Comunicaciones", {
    serial: "MIC-3310",
    maintenanceEveryDays: 60,
    lastMaintenanceAt: daysAgo(20),
  });
  maint(mic, "mantenimiento", "Cambio de baterías", 20);
  o("HER-001", "Kit de herramientas básicas", "Herramientas", 4, "nuevo", "Bodega", "Mantenimiento");

  // Elemento con variantes: el televisor existe en varios modelos y marcas
  const tv = o("TEC-001", "Televisor", "Tecnología", 0, "bueno", "Sala de reuniones", "Logística");
  o("TEC-001-A", "Televisor 55\" 4K", "Tecnología", 2, "bueno", "Sala de reuniones", "Logística", {
    parentId: tv.id,
    brand: "Samsung",
    model: "UN55CU7000",
    maintenanceEveryDays: 365,
    lastMaintenanceAt: daysAgo(380),
  });
  o("TEC-001-B", "Televisor 43\" Full HD", "Tecnología", 1, "bueno", "Oficina principal", "Comunicaciones", {
    parentId: tv.id,
    brand: "LG",
    model: "43LM6300",
  });

  return db;
}
