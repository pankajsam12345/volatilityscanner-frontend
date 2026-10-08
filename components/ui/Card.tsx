export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`panel p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function KpiTile({ label, value, sub, tone = "neutral" }: { label: string; value: string; sub?: string; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-red-400" : "text-zinc-100";
  return (
    <div className="panel px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mono text-lg font-semibold ${color}`}>{value}</div>
      {sub && <div className="mono text-[11px] text-zinc-500">{sub}</div>}
    </div>
  );
}
