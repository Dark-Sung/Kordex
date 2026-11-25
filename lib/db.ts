import { promises as fs, existsSync } from "fs";
import type { DatabaseSync } from "node:sqlite";
import { DATA_DIR, LEGACY_JSON_FILE, SQLITE_FILE } from "./paths";
import { emptyDB, seedDemo } from "./seed";
import type { DB } from "./types";

// Cola de operaciones para evitar escrituras simultáneas
let queue: Promise<unknown> = Promise.resolve();

// Esquema SQL de todas las tablas de la base de datos
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  photo         TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS login_attempts (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  first_at     TEXT NOT NULL,
  locked_until TEXT
);

CREATE TABLE IF NOT EXISTS companies (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('tienda','organizacion')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('propietario','administrador','operador','consulta')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_company ON categories(company_id);

CREATE TABLE IF NOT EXISTS items (
  id                      TEXT PRIMARY KEY,
  company_id              TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code                    TEXT NOT NULL COLLATE NOCASE,
  name                    TEXT NOT NULL,
  category_id             TEXT NOT NULL,
  unit                    TEXT NOT NULL,
  stock                   INTEGER NOT NULL,
  location                TEXT NOT NULL,
  photo                   TEXT,
  parent_id               TEXT REFERENCES items(id),
  brand                   TEXT NOT NULL DEFAULT '',
  model                   TEXT NOT NULL DEFAULT '',
  cost                    REAL NOT NULL DEFAULT 0,
  price                   REAL NOT NULL DEFAULT 0,
  min_stock               INTEGER NOT NULL DEFAULT 0,
  condition               TEXT CHECK (condition IS NULL OR condition IN ('nuevo','bueno','regular','reparacion','danado')),
  serial                  TEXT NOT NULL DEFAULT '',
  responsible             TEXT NOT NULL DEFAULT '',
  notes                   TEXT NOT NULL DEFAULT '',
  maintenance_every_days  INTEGER,
  last_maintenance_at     TEXT,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL,
  UNIQUE (company_id, code)
);
CREATE INDEX IF NOT EXISTS idx_items_company ON items(company_id);
CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_id);

CREATE TABLE IF NOT EXISTS movements (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('entrada','salida','ajuste')),
  delta       INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  note        TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movements_company ON movements(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_movements_item ON movements(item_id);

CREATE TABLE IF NOT EXISTS maintenance (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_id    TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('mantenimiento','cambio')),
  note       TEXT NOT NULL,
  changes    TEXT NOT NULL DEFAULT '[]',
  user_id    TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_maintenance_company ON maintenance(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_item ON maintenance(item_id);
`;

// Mapa entre colecciones del modelo y tablas de SQLite
type TableSpec = {
  collection: keyof DB;
  table: string;
  key: string[]; // campos que forman la clave primaria (camelCase)
  fields: string[]; // todos los campos en el orden de las columnas (camelCase)
  json?: string[]; // campos que se serializan como JSON en texto
};

const TABLES: TableSpec[] = [
  { collection: "users", table: "users", key: ["id"], fields: ["id", "name", "email", "passwordHash", "photo", "createdAt"] },
  { collection: "sessions", table: "sessions", key: ["tokenHash"], fields: ["tokenHash", "userId", "expiresAt"] },
  {
    collection: "loginAttempts",
    table: "login_attempts",
    key: ["key"],
    fields: ["key", "count", "firstAt", "lockedUntil"],
  },
  { collection: "companies", table: "companies", key: ["id"], fields: ["id", "name", "type", "createdAt"] },
  {
    collection: "memberships",
    table: "memberships",
    key: ["userId", "companyId"],
    fields: ["userId", "companyId", "role", "createdAt"],
  },
  { collection: "categories", table: "categories", key: ["id"], fields: ["id", "companyId", "name"] },
  {
    collection: "items",
    table: "items",
    key: ["id"],
    fields: [
      "id", "companyId", "code", "name", "categoryId", "unit", "stock", "location",
      "photo", "parentId", "brand", "model", "cost", "price", "minStock", "condition",
      "serial", "responsible", "notes", "maintenanceEveryDays", "lastMaintenanceAt",
      "createdAt", "updatedAt",
    ],
  },
  {
    collection: "movements",
    table: "movements",
    key: ["id"],
    fields: ["id", "companyId", "itemId", "type", "delta", "stockAfter", "note", "userId", "createdAt"],
  },
  {
    collection: "maintenance",
    table: "maintenance",
    key: ["id"],
    fields: ["id", "companyId", "itemId", "kind", "note", "changes", "userId", "createdAt"],
    json: ["changes"],
  },
];

// Convierte camelCase a snake_case y viceversa
const snake = (s: string) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

type Row = Record<string, unknown>;
type Snapshot = Map<string, Map<string, string>>;
type SqlValue = string | number | null;

// Instantánea de la base al momento de leer, usada para detectar qué filas cambiaron
const snapshots = new WeakMap<DB, Snapshot>();

const KEY_SEP = "\u0001";
const rowKey = (spec: TableSpec, row: Row) => spec.key.map((k) => String(row[k])).join(KEY_SEP);

// Convierte un objeto de modelo a valores SQL en el orden de las columnas
function toSqlValues(spec: TableSpec, row: Row): SqlValue[] {
  return spec.fields.map((f) => {
    const v = row[f];
    if (v === undefined || v === null) return null;
    if (spec.json?.includes(f)) return JSON.stringify(v);
    return v as string | number;
  });
}

// Abre o reutiliza la conexión SQLite (singleton en globalThis)
type G = typeof globalThis & { __inventarioSqlite?: DatabaseSync };

function openConnection(): DatabaseSync {
  const g = globalThis as G;
  if (g.__inventarioSqlite) return g.__inventarioSqlite;

  const sqlite = process.getBuiltinModule?.("node:sqlite") as typeof import("node:sqlite") | undefined;
  if (!sqlite) {
    throw new Error(
      "Esta aplicación guarda sus datos en SQLite y necesita Node.js 22.5 o superior (usa el módulo node:sqlite). " +
        "Actualiza Node.js e inténtalo de nuevo.",
    );
  }
  const conn = new sqlite.DatabaseSync(SQLITE_FILE);
  conn.exec("PRAGMA journal_mode = WAL");
  conn.exec("PRAGMA foreign_keys = ON");
  conn.exec("PRAGMA busy_timeout = 5000");
  conn.exec(SCHEMA);
  conn.exec("BEGIN IMMEDIATE");
  try {
    if (!conn.prepare("PRAGMA table_info(users)").all().some((column) => column.name === "photo")) {
      conn.exec("ALTER TABLE users ADD COLUMN photo TEXT");
    }
    conn.exec("COMMIT");
  } catch (error) {
    conn.exec("ROLLBACK");
    conn.close();
    throw error;
  }
  g.__inventarioSqlite = conn;
  return conn;
}

let ready: Promise<DatabaseSync> | undefined;

// Abre la base y, la primera vez, importa el JSON anterior o carga los datos de demo
function connection(): Promise<DatabaseSync> {
  return (ready ??= (async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const isNew = !existsSync(SQLITE_FILE);
    const conn = openConnection();
    if (isNew) {
      const initial = await initialData();
      if (initial) writeAll(conn, initial);
    }
    return conn;
  })().catch((e) => {
    ready = undefined;
    throw e;
  }));
}

// Determina con qué datos arrancar una base nueva
async function initialData(): Promise<DB | null> {
  if (existsSync(LEGACY_JSON_FILE)) {
    const parsed = JSON.parse(await fs.readFile(LEGACY_JSON_FILE, "utf8")) as Partial<DB>;
    if (Array.isArray(parsed.users) && Array.isArray(parsed.companies)) {
      const db = { ...emptyDB(), ...parsed } as DB;
      // Rellena campos nuevos que no existían en registros antiguos
      db.items = db.items.map((i) => ({ ...i, brand: i.brand ?? "", model: i.model ?? "" }));
      await fs.rename(LEGACY_JSON_FILE, LEGACY_JSON_FILE.replace(/\.json$/, `.migrado-${Date.now()}.json`));
      return db;
    }
    // JSON sin cuentas válidas: se guarda como copia y se empieza limpio
    await fs.rename(LEGACY_JSON_FILE, LEGACY_JSON_FILE.replace(/\.json$/, `.anterior-${Date.now()}.json`));
  }
  return process.env.NODE_ENV === "production" ? null : seedDemo();
}

// Lee todas las filas de la base y construye el objeto DB
function readAll(conn: DatabaseSync): DB {
  const db = emptyDB();
  const snap: Snapshot = new Map();
  for (const spec of TABLES) {
    const rows = conn.prepare(`SELECT * FROM ${spec.table}`).all() as Row[];
    const list: Row[] = [];
    const seen = new Map<string, string>();
    for (const raw of rows) {
      const row: Row = {};
      for (const [col, val] of Object.entries(raw)) {
        const field = camel(col);
        if (val === null) continue; // los opcionales quedan como undefined
        row[field] = spec.json?.includes(field) ? JSON.parse(val as string) : val;
      }
      list.push(row);
      seen.set(rowKey(spec, row), JSON.stringify(toSqlValues(spec, row)));
    }
    (db[spec.collection] as unknown as Row[]) = list;
    snap.set(spec.table, seen);
  }
  snapshots.set(db, snap);
  return db;
}

// Escribe solo las filas que cambiaron respecto a la lectura, dentro de una transacción
function writeAll(conn: DatabaseSync, db: DB): void {
  const snap = snapshots.get(db) ?? new Map<string, Map<string, string>>();
  conn.exec("BEGIN IMMEDIATE");
  try {
    // Permite escribir en cualquier orden; las claves foráneas se verifican al confirmar
    conn.exec("PRAGMA defer_foreign_keys = ON");

    // Primero elimina las filas que ya no existen
    for (const spec of TABLES) {
      const before = snap.get(spec.table) ?? new Map<string, string>();
      const now = new Set((db[spec.collection] as unknown as Row[]).map((r) => rowKey(spec, r)));
      const del = conn.prepare(
        `DELETE FROM ${spec.table} WHERE ${spec.key.map((k) => `${snake(k)} = ?`).join(" AND ")}`,
      );
      for (const key of before.keys()) {
        if (!now.has(key)) del.run(...key.split(KEY_SEP));
      }
    }

    // Luego inserta las nuevas y actualiza las modificadas
    for (const spec of TABLES) {
      const before = snap.get(spec.table) ?? new Map<string, string>();
      const cols = spec.fields.map(snake);
      const insert = conn.prepare(
        `INSERT INTO ${spec.table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      );
      const setFields = spec.fields.filter((f) => !spec.key.includes(f));
      const update = setFields.length
        ? conn.prepare(
            `UPDATE ${spec.table} SET ${setFields.map((f) => `${snake(f)} = ?`).join(", ")} WHERE ${spec.key
              .map((k) => `${snake(k)} = ?`)
              .join(" AND ")}`,
          )
        : null;

      for (const row of db[spec.collection] as unknown as Row[]) {
        const values = toSqlValues(spec, row);
        const prev = before.get(rowKey(spec, row));
        if (prev === JSON.stringify(values)) continue; // sin cambios
        if (prev === undefined) insert.run(...values);
        else if (update) {
          const byField = new Map(spec.fields.map((f, i) => [f, values[i]] as const));
          update.run(...setFields.map((f) => byField.get(f)!), ...spec.key.map((k) => byField.get(k)!));
        }
      }
    }
    conn.exec("COMMIT");
  } catch (e) {
    conn.exec("ROLLBACK");
    throw e;
  }
}

async function load(): Promise<DB> {
  return readAll(await connection());
}

// Lee la base de datos
export function readDB(): Promise<DB> {
  const run = queue.then(load);
  queue = run.catch(() => undefined);
  return run;
}

// Aplica un cambio sobre la base y lo persiste; si la función lanza, no se guarda nada
export function mutate<T>(fn: (db: DB) => T): Promise<T> {
  const run = queue.then(async () => {
    const conn = await connection();
    const db = readAll(conn);
    const result = fn(db);
    writeAll(conn, db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
