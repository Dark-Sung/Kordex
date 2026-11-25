import type { ChangeEntry } from "@/lib/types";

// Lista los cambios de un elemento en formato "Campo: antes → después"
export default function ChangeList({ changes }: { changes: ChangeEntry[] }) {
  if (changes.length === 0) return null;
  return (
    <ul className="change-list">
      {changes.map((c, i) => (
        <li key={i}>
          <span className="strong">{c.field}:</span> <span className="muted">{c.from}</span> → {c.to}
        </li>
      ))}
    </ul>
  );
}
