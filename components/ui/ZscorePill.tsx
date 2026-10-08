export function ZscorePill({ z }: { z: number | null | undefined }) {
  if (z === null || z === undefined || Number.isNaN(z)) return <span className="mono text-zinc-600">—</span>;
  const abs = Math.abs(z);
  const color = abs >= 2 ? (z > 0 ? "text-amber-400" : "text-blue-400") : abs >= 1 ? "text-zinc-200" : "text-zinc-500";
  return <span className={`mono ${color}`}>{z > 0 ? "+" : ""}{z.toFixed(2)}σ</span>;
}

export function PercentileBar({ p }: { p: number | null | undefined }) {
  if (p === null || p === undefined) return <span className="mono text-zinc-600">—</span>;
  const extreme = p >= 90 || p <= 10;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full ${extreme ? "bg-amber-400" : "bg-zinc-500"}`}
          style={{ width: `${Math.min(Math.max(p, 2), 100)}%` }}
        />
      </div>
      <span className="mono text-[11px] text-zinc-400">{p.toFixed(0)}%</span>
    </div>
  );
}
