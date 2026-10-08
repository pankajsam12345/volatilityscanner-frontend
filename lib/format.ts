export function pct(x: number | null | undefined, digits = 1): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(digits)}%`;
}

export function vol(x: number | null | undefined, digits = 2): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  return `${(x * 100).toFixed(digits)}`;
}

export function volPts(x: number | null | undefined, digits = 2): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  const sign = x > 0 ? "+" : "";
  return `${sign}${x.toFixed(digits)}`;
}

export function num(x: number | null | undefined, digits = 2): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  return x.toFixed(digits);
}

export function signedNum(x: number | null | undefined, digits = 2): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  const sign = x > 0 ? "+" : "";
  return `${sign}${x.toFixed(digits)}`;
}

export function intFmt(x: number | null | undefined): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  return new Intl.NumberFormat("en-IN").format(x);
}

export function dateFmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function timeFmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function edgeColor(x: number | null | undefined): string {
  if (x === null || x === undefined) return "text-zinc-400";
  if (x > 0.01) return "text-emerald-400";
  if (x < -0.01) return "text-red-400";
  return "text-zinc-400";
}

export function zscoreColor(z: number | null | undefined): string {
  if (z === null || z === undefined) return "text-zinc-400";
  const abs = Math.abs(z);
  if (abs >= 2) return "text-amber-400";
  if (abs >= 1) return "text-zinc-200";
  return "text-zinc-400";
}
