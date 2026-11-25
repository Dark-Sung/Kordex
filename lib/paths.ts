import path from "path";

// Carpeta raíz de datos, configurable con la variable de entorno DATA_DIR
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

// Archivo de base de datos SQLite
export const SQLITE_FILE = path.join(DATA_DIR, "inventario.db");

// Archivo JSON de la versión anterior, se importa una sola vez si existe
export const LEGACY_JSON_FILE = path.join(DATA_DIR, "db.json");

// Carpeta donde se guardan las fotos subidas
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
