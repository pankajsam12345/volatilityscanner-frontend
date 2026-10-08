"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Opportunity } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, LiquidityBadge } from "@/components/ui/Badge";
import { OpportunityCard } from "@/components/OpportunityCard";
import { volPts, edgeColor } from "@/lib/format";

const STRATEGIES = ["", "IV_VS_RV", "CALENDAR", "RISK_REVERSAL", "BUTTERFLY", "SKEW", "FORWARD_VOL"];
const LIQUIDITY = ["", "HIGH", "MEDIUM", "LOW", "REJECTED"];
const SORT_FIELDS = ["net_edge", "score", "confidence", "risk_reward", "max_risk", "gross_edge"];

export default function ScannerPage() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [minNetEdge, setMinNetEdge] = useState("");
  const [minConfidence, setMinConfidence] = useState("");
  const [maxRisk, setMaxRisk] = useState("");
  const [liquidity, setLiquidity] = useState("");
  const [strategy, setStrategy] = useState("");
  const [sortBy, setSortBy] = useState("net_edge");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setLoading(true);
    api
      .opportunities({
        min_net_edge: minNetEdge || undefined,
        min_confidence: minConfidence || undefined,
        max_risk: maxRisk || undefined,
        liquidity: liquidity || undefined,
        strategy: strategy || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      })
      .then(setOpps)
      .finally(() => setLoading(false));
  }, [minNetEdge, minConfidence, maxRisk, liquidity, strategy, sortBy, sortDir]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Opportunity Scanner" subtitle="Relative-value opportunities across all underlyings, ranked and filterable" />
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <Field label="Min Net Edge (vol pts)">
            <input value={minNetEdge} onChange={(e) => setMinNetEdge(e.target.value)} placeholder="e.g. 0" className="input" type="number" step="0.1" />
          </Field>
          <Field label="Min Confidence %">
            <input value={minConfidence} onChange={(e) => setMinConfidence(e.target.value)} placeholder="e.g. 60" className="input" type="number" />
          </Field>
          <Field label="Max Risk">
            <input value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)} placeholder="unbounded" className="input" type="number" step="0.1" />
          </Field>
          <Field label="Liquidity">
            <select value={liquidity} onChange={(e) => setLiquidity(e.target.value)} className="input">
              {LIQUIDITY.map((l) => (
                <option key={l} value={l}>
                  {l || "Any"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Strategy">
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="input">
              {STRATEGIES.map((s) => (
                <option key={s} value={s}>
                  {s ? s.replace(/_/g, " ") : "Any"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort By">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
              {SORT_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Direction">
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")} className="input">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        {loading && <p className="text-xs text-zinc-500">Loading…</p>}
        {!loading && opps.length === 0 && <p className="text-xs text-zinc-500">No opportunities match these filters.</p>}
        {opps.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Strategy</th>
                <th>Direction</th>
                <th>Gross</th>
                <th>Cost</th>
                <th>Net Edge</th>
                <th>Score</th>
                <th>Confidence</th>
                <th>Risk/Reward</th>
                <th>Liquidity</th>
              </tr>
            </thead>
            {opps.map((o) => (
              <tbody key={o.id}>
                <tr className="cursor-pointer" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <td className="text-left font-medium text-zinc-100">{o.symbol}</td>
                  <td className="text-left">
                    <Badge>{o.strategy.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="text-left text-zinc-300">{o.direction.replace(/_/g, " ")}</td>
                  <td className="mono">{volPts(o.gross_edge)}</td>
                  <td className="mono text-zinc-500">-{o.transaction_cost.toFixed(2)}</td>
                  <td className={`mono font-semibold ${edgeColor(o.net_edge)}`}>{volPts(o.net_edge)}</td>
                  <td className="mono">{o.score.toFixed(0)}</td>
                  <td className="mono">{o.confidence.toFixed(0)}%</td>
                  <td className="mono">{o.risk_reward.toFixed(2)}</td>
                  <td className="text-left">
                    <LiquidityBadge status={o.liquidity_status} />
                  </td>
                </tr>
                {expanded === o.id && (
                  <tr>
                    <td colSpan={10} className="bg-zinc-950 p-3">
                      <OpportunityCard o={o} />
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </table>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
