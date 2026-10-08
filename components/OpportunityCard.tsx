import type { Opportunity } from "@/lib/types";
import { Badge, LiquidityBadge } from "./ui/Badge";
import { volPts, num, pct, signedNum } from "@/lib/format";

const SCORE_LABELS: Record<string, string> = {
  statistical_edge: "Statistical Edge",
  historical_consistency: "Historical Consistency",
  liquidity: "Liquidity",
  cost_efficiency: "Cost Efficiency",
  model_confidence: "Model Confidence",
  risk: "Risk",
};

export function OpportunityCard({ o }: { o: Opportunity }) {
  const hist = o.historical_context as {
    metric?: string; observed?: number; fair_value?: number | null; fair_value_model?: string | null;
    deviation?: number | null; zscore?: number | null; percentile?: number | null; mean?: number | null; sample_size?: number;
  };

  return (
    <div className="panel divide-y divide-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between bg-zinc-900/60 px-4 py-2.5">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Volatility Opportunity</div>
          <div className="text-sm font-semibold text-zinc-100">
            {o.symbol} · <Badge>{o.strategy.replace(/_/g, " ")}</Badge>
          </div>
        </div>
        <LiquidityBadge status={o.liquidity_status} />
      </div>

      <div className="px-4 py-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Legs</div>
        <ul className="space-y-1">
          {o.legs.map((leg, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span className={leg.action === "BUY" ? "font-semibold text-emerald-400" : leg.action === "SELL" ? "font-semibold text-red-400" : "text-zinc-500"}>
                {leg.action}
              </span>
              <span className="text-zinc-300">{leg.description}</span>
              {leg.iv !== null && <span className="mono text-zinc-500">IV {pct(leg.iv, 1)}</span>}
              <LiquidityBadge status={leg.liquidity} />
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 py-3 text-xs">
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Historical Context</div>
          <Row label={hist.metric ?? "Metric"} value={num(hist.observed, 3)} />
          <Row label="Historical Mean" value={num(hist.mean, 3)} />
          <Row label="Fair Value" value={hist.fair_value != null ? `${num(hist.fair_value, 3)} (${hist.fair_value_model})` : "—"} />
          <Row label="Z-score" value={hist.zscore != null ? `${hist.zscore.toFixed(2)}σ` : "—"} />
          <Row label="Percentile" value={hist.percentile != null ? `${hist.percentile.toFixed(0)}%` : "—"} />
          <Row label="Sample Size" value={String(hist.sample_size ?? "—")} />
        </div>
        <div>
          <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Edge (vol points)</div>
          <Row label="Gross Edge" value={volPts(o.gross_edge)} />
          <Row label="Transaction Cost" value={`-${o.transaction_cost.toFixed(2)}`} />
          <Row label="NET EDGE" value={volPts(o.net_edge)} emphasis={o.net_edge >= 0 ? "positive" : "negative"} />
          <Row label="Max Risk (heuristic)" value={num(o.max_risk)} />
          <Row label="Risk/Reward" value={num(o.risk_reward)} />
          <Row label="Confidence" value={`${o.confidence.toFixed(0)}%`} />
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Score Breakdown (total {o.score.toFixed(0)})</div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs sm:grid-cols-6">
          {Object.entries(SCORE_LABELS).map(([key, label]) => (
            <div key={key}>
              <div className="text-zinc-500">{label}</div>
              <div className="mono text-zinc-200">{typeof o.score_components[key] === "number" ? (o.score_components[key] as number).toFixed(0) : "—"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Portfolio Greeks</div>
        <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs sm:grid-cols-8">
          {["delta", "gamma", "vega", "theta", "rho", "vanna", "volga", "charm"].map((k) => (
            <div key={k}>
              <div className="text-zinc-500 uppercase">{k}</div>
              <div className="mono text-zinc-200">{o.greeks[k] !== undefined ? signedNum(o.greeks[k], 2) : "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {o.no_arbitrage_flags.length > 0 && (
        <div className="px-4 py-3">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">No-Arbitrage Flags</div>
          {o.no_arbitrage_flags.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <Badge tone={f.passed ? "positive" : "warning"}>{f.passed ? "OK" : "FLAG"}</Badge>
              <span className="text-zinc-400">{f.detail}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Why?</div>
        <ol className="list-decimal space-y-1 pl-4 text-xs text-zinc-300">
          {o.explanation.why.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ol>
      </div>

      <div className="px-4 py-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Risks</div>
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
          {o.explanation.risks.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: "positive" | "negative" }) {
  const color = emphasis === "positive" ? "text-emerald-400" : emphasis === "negative" ? "text-red-400" : "text-zinc-200";
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-500">{label}</span>
      <span className={`mono ${color} ${emphasis ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
