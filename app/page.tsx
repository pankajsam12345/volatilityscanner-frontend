"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Opportunity, Underlying } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader, KpiTile } from "@/components/ui/Card";
import { Badge, LiquidityBadge } from "@/components/ui/Badge";
import { pct, dateFmt, volPts, edgeColor } from "@/lib/format";

export default function OverviewPage() {
  const { symbol } = useSymbol();
  const [underlyings, setUnderlyings] = useState<Underlying[]>([]);
  const [topOpps, setTopOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.underlyings(), api.opportunities({ sort_by: "net_edge", sort_dir: "desc" })])
      .then(([u, o]) => {
        if (cancelled) return;
        setUnderlyings(u);
        setTopOpps(o.slice(0, 8));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const current = underlyings.find((u) => u.symbol === symbol);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-3">
        <KpiTile label="Spot" value={current ? current.spot_price.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"} sub={current?.exchange} />
        <KpiTile label="ATM IV (1M)" value={pct(current?.atm_iv_1m)} />
        <KpiTile label="RV20 (Close-Close)" value={pct(current?.rv20)} />
        <KpiTile
          label="IV-RV Spread"
          value={current?.iv_rv_spread !== undefined && current?.iv_rv_spread !== null ? volPts(current.iv_rv_spread * 100) : "—"}
          tone={current?.iv_rv_spread ? (current.iv_rv_spread > 0 ? "positive" : "negative") : "neutral"}
        />
        <KpiTile label="Live Opportunities" value={String(topOpps.filter((o) => o.symbol === symbol).length)} />
      </div>

      <Card>
        <CardHeader title="Underlyings" subtitle="Multi-symbol snapshot — model-based estimates on DEMO DATA" />
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Exchange</th>
              <th>Spot</th>
              <th>ATM IV (1M)</th>
              <th>RV20</th>
              <th>IV-RV</th>
              <th>As of</th>
            </tr>
          </thead>
          <tbody>
            {underlyings.map((u) => (
              <tr key={u.symbol}>
                <td className="text-left font-medium text-zinc-100">{u.symbol}</td>
                <td>{u.exchange}</td>
                <td className="mono">{u.spot_price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                <td className="mono">{pct(u.atm_iv_1m)}</td>
                <td className="mono">{pct(u.rv20)}</td>
                <td className={`mono ${edgeColor(u.iv_rv_spread)}`}>{u.iv_rv_spread !== null ? volPts(u.iv_rv_spread * 100) : "—"}</td>
                <td className="text-zinc-500">{dateFmt(u.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader
          title="Top Relative-Value Opportunities"
          subtitle="Ranked by transaction-cost-adjusted net edge across all underlyings"
          right={
            <Link href="/scanner" className="text-xs text-blue-400 hover:underline">
              Open full scanner →
            </Link>
          }
        />
        {loading && <p className="text-xs text-zinc-500">Loading…</p>}
        {!loading && topOpps.length === 0 && (
          <p className="text-xs text-zinc-500">
            No opportunities yet. Run <code className="mono">POST /api/opportunities/&#123;symbol&#125;/refresh</code> or wait for the
            scheduled Celery job.
          </p>
        )}
        {topOpps.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Strategy</th>
                <th>Direction</th>
                <th>Net Edge (vol pts)</th>
                <th>Score</th>
                <th>Confidence</th>
                <th>Liquidity</th>
              </tr>
            </thead>
            <tbody>
              {topOpps.map((o) => (
                <tr key={o.id}>
                  <td className="text-left font-medium text-zinc-100">{o.symbol}</td>
                  <td className="text-left">
                    <Badge>{o.strategy.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="text-left text-zinc-300">{o.direction.replace(/_/g, " ")}</td>
                  <td className={`mono ${edgeColor(o.net_edge)}`}>{volPts(o.net_edge)}</td>
                  <td className="mono">{o.score.toFixed(0)}</td>
                  <td className="mono">{o.confidence.toFixed(0)}%</td>
                  <td className="text-left">
                    <LiquidityBadge status={o.liquidity_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
