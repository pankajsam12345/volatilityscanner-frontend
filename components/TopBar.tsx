"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Underlying } from "@/lib/types";
import { useSymbol } from "./SymbolContext";
import { Badge, DemoBadge } from "./ui/Badge";
import { LoginWidget } from "./LoginWidget";
import { pct } from "@/lib/format";

const SYMBOLS = ["NIFTY", "BANKNIFTY", "SPX"];

export function TopBar() {
  const { symbol, setSymbol } = useSymbol();
  const [data, setData] = useState<Underlying | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    api
      .underlyings()
      .then((rows) => {
        if (cancelled) return;
        const found = rows.find((r) => r.symbol === symbol) ?? null;
        setData(found);
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <div className="flex h-14 shrink-0 items-center gap-6 border-b border-zinc-800 bg-panel px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tracking-tight text-zinc-100">VOL SCANNER</span>
        <DemoBadge />
      </div>

      <select
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        className="mono rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {SYMBOLS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {error && <span className="text-xs text-red-400">Backend unreachable</span>}

      {data && (
        <div className="flex flex-1 items-center gap-6 mono text-xs text-zinc-400">
          <Metric label="SPOT" value={data.spot_price.toLocaleString("en-IN", { maximumFractionDigits: 2 })} />
          <Metric label="ATM IV (1M)" value={pct(data.atm_iv_1m)} />
          <Metric label="RV20" value={pct(data.rv20)} />
          <Metric
            label="IV-RV"
            value={data.iv_rv_spread !== null ? `${data.iv_rv_spread >= 0 ? "+" : ""}${(data.iv_rv_spread * 100).toFixed(2)}` : "—"}
            tone={data.iv_rv_spread !== null ? (data.iv_rv_spread > 0 ? "positive" : "negative") : "neutral"}
          />
          <RegimeBadge regime={data.regime} />
          <span className="text-zinc-600">{data.exchange} · {new Date(data.timestamp).toLocaleString()}</span>
        </div>
      )}

      <div className="ml-auto">
        <LoginWidget />
      </div>
    </div>
  );
}

function RegimeBadge({ regime }: { regime: string }) {
  const tone = regime === "EXTREME" ? "negative" : regime === "HIGH" ? "warning" : regime === "LOW" ? "info" : "neutral";
  return <Badge tone={tone}>{regime} VOL</Badge>;
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-red-400" : "text-zinc-200";
  return (
    <span>
      <span className="text-zinc-600">{label} </span>
      <span className={color}>{value}</span>
    </span>
  );
}
