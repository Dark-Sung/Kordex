import { stockLevel } from "@/lib/stock";

// Barra visual de existencias con marca en el stock mínimo
export default function StockGauge({ stock, min }: { stock: number; min: number }) {
  const cap = Math.max(min * 3, stock, 1);
  const pct = Math.min(100, (Math.max(stock, 0) / cap) * 100);
  const tick = Math.min(100, (min / cap) * 100);
  const level = stockLevel({ stock, minStock: min });
  return (
    <div className="gauge" role="img" aria-label={`Stock ${stock}, mínimo ${min}`}>
      <span className={`gauge-fill ${level}`} style={{ width: `${pct}%` }} />
      <span className="gauge-tick" style={{ left: `${tick}%` }} />
    </div>
  );
}
