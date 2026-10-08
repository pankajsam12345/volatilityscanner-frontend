export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "positive" | "negative" | "warning" | "info" }) {
  const tones: Record<string, string> = {
    neutral: "bg-zinc-800 text-zinc-300 border-zinc-700",
    positive: "bg-emerald-950 text-emerald-400 border-emerald-800",
    negative: "bg-red-950 text-red-400 border-red-800",
    warning: "bg-amber-950 text-amber-400 border-amber-800",
    info: "bg-blue-950 text-blue-400 border-blue-800",
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function LiquidityBadge({ status }: { status: string }) {
  const tone = status === "HIGH" ? "positive" : status === "MEDIUM" ? "info" : status === "LOW" ? "warning" : "negative";
  return <Badge tone={tone}>{status}</Badge>;
}

export function DemoBadge() {
  return <Badge tone="warning">DEMO DATA</Badge>;
}
