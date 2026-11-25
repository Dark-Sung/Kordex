import MaintenanceField from "@/components/MaintenanceField";
import PhotoField from "@/components/PhotoField";
import { conditionLabels, conditions, labelsFor } from "@/lib/labels";
import { photoUrl } from "@/lib/photos";
import type { Category, CompanyType, Item } from "@/lib/types";

type Props = {
  type: CompanyType;
  companyId: string;
  categories: Category[];
  item?: Item;
  defaults?: Partial<Item>; // valores iniciales sugeridos al crear una variante
  parent?: Item; // si se indica, el nuevo registro es variante y hereda la categoría del padre
  withInitialStock?: boolean; // pide la cantidad inicial solo al crear
};

// Campos del formulario de un item, adaptados según el tipo de empresa
export default function ItemFields({ type, companyId, categories, item, defaults, parent, withInitialStock }: Props) {
  const l = labelsFor(type);
  const d: Partial<Item> = item ?? defaults ?? {};
  const isChild = Boolean(parent ?? item?.parentId);
  const parentCategory = parent?.categoryId ?? item?.categoryId;
  return (
    <div className="fields">
      {parent && <input type="hidden" name="parentId" value={parent.id} />}

      {/* Campos comunes a todos los tipos */}
      <label className="field">
        <span>{l.code}</span>
        <input name="code" defaultValue={d.code} required maxLength={40} placeholder={type === "tienda" ? "HER-003" : "CMP-010"} />
      </label>
      <label className="field wide">
        <span>Nombre</span>
        <input name="name" defaultValue={d.name} required maxLength={120} />
      </label>

      {/* Categoría: solo lectura en variantes, seleccionable en registros principales */}
      {isChild ? (
        <div className="field">
          <span>Categoría</span>
          <div className="static-value">{categories.find((c) => c.id === parentCategory)?.name ?? "—"}</div>
          <small>Las variantes usan la categoría de su registro principal.</small>
        </div>
      ) : (
        <label className="field">
          <span>Categoría</span>
          <select name="categoryId" defaultValue={d.categoryId ?? ""} required>
            <option value="" disabled>
              Elige una categoría
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>Marca</span>
        <input name="brand" defaultValue={d.brand} maxLength={60} placeholder="Samsung, Bosch…" />
      </label>
      <label className="field">
        <span>Modelo</span>
        <input name="model" defaultValue={d.model} maxLength={60} placeholder="Referencia o modelo" />
      </label>
      <label className="field">
        <span>Unidad de medida</span>
        <input name="unit" defaultValue={d.unit ?? "und"} maxLength={12} placeholder="und, kg, m, caja" />
      </label>

      {/* Campos específicos de tienda */}
      {type === "tienda" ? (
        <>
          <label className="field">
            <span>Costo (COP)</span>
            <input name="cost" type="number" min="0" step="any" defaultValue={d.cost ?? 0} />
          </label>
          <label className="field">
            <span>Precio de venta (COP)</span>
            <input name="price" type="number" min="0" step="any" defaultValue={d.price ?? 0} />
          </label>
          {withInitialStock && (
            <label className="field">
              <span>Stock inicial</span>
              <input name="stock" type="number" min="0" step="1" defaultValue={0} />
            </label>
          )}
          <label className="field">
            <span>Stock mínimo</span>
            <input name="minStock" type="number" min="0" step="1" defaultValue={d.minStock ?? 0} />
            <small>Por debajo de este número, el producto aparece para reponer.</small>
          </label>
        </>
      ) : (
        // Campos específicos de organización
        <>
          <label className="field">
            <span>{withInitialStock ? "Cantidad inicial" : "Cantidad"}</span>
            <input name="stock" type="number" min="0" step="1" defaultValue={withInitialStock ? 1 : item?.stock ?? 0} />
          </label>
          <label className="field">
            <span>Estado</span>
            <select name="condition" defaultValue={d.condition ?? "bueno"}>
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {conditionLabels[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Responsable</span>
            <input name="responsible" defaultValue={d.responsible} maxLength={80} placeholder="Persona o área" />
          </label>
          <label className="field">
            <span>Número de serie</span>
            <input name="serial" defaultValue={d.serial} maxLength={60} />
          </label>
        </>
      )}

      <label className="field wide">
        <span>Ubicación</span>
        <input name="location" defaultValue={d.location} maxLength={60} placeholder={type === "tienda" ? "Estante A1" : "Oficina principal"} />
      </label>

      {type === "organizacion" && <MaintenanceField defaultDays={d.maintenanceEveryDays} />}

      {type === "organizacion" && (
        <label className="field wide">
          <span>Notas</span>
          <textarea name="notes" defaultValue={d.notes} maxLength={500} rows={3} />
        </label>
      )}

      <PhotoField key={item?.photo ?? "sin-foto"} currentUrl={photoUrl(companyId, item?.photo)} />
    </div>
  );
}
