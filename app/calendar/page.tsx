"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CalendarResponse } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ZscorePill } from "@/components/ui/ZscorePill";
import { volPts } from "@/lib/format";

export default function CalendarPage() {
  const { symbol } = useSymbol();
  const [data, setData] = useState<CalendarResponse | null>(null);

  useEffect(() => {
    api.calendar(symbol).then(setData);
  }, [symbol]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={`Calendar Analyzer — ${symbol}`} subtitle="Every near→far expiry pair: spread, forward vol, and historical context where available" />
        <table className="data-table">
          <thead>
            <tr>
              <th>Near</th>
              <th>Far</th>
              <th>Near IV</th>
              <th>Far IV</th>
              <th>Calendar Spread (vol pts)</th>
              <th>Z-score</th>
              <th>Percentile</th>
              <th>Forward Vol</th>
              <th>Signal</th>
              <th>No-Arb</th>
            </tr>
          </thead>
          <tbody>
            {data?.cells.map((c) => (
              <tr key={`${c.near_label}-${c.far_label}`}>
                <td className="text-left"><Badge>{c.near_label}</Badge></td>
                <td className="text-left"><Badge>{c.far_label}</Badge></td>
                <td className="mono">{c.near_iv !== null ? `${(c.near_iv * 100).toFixed(1)}%` : "—"}</td>
                <td className="mono">{c.far_iv !== null ? `${(c.far_iv * 100).toFixed(1)}%` : "—"}</td>
                <td className={`mono ${c.calendar_spread >= 0 ? "text-emerald-400" : "text-red-400"}`}>{volPts(c.calendar_spread * 100)}</td>
                <td><ZscorePill z={c.calendar_spread_vol_pts_zscore} /></td>
                <td className="mono">{c.calendar_spread_vol_pts_percentile !== null ? `${c.calendar_spread_vol_pts_percentile.toFixed(0)}%` : "—"}</td>
                <td className="mono">{c.forward_vol_valid ? `${(c.forward_vol! * 100).toFixed(1)}%` : <span className="text-amber-400">invalid</span>}</td>
                <td className="text-left">
                  <Badge tone={c.signal === "RICH" ? "warning" : c.signal === "CHEAP" ? "info" : "neutral"}>{c.signal}</Badge>
                </td>
                <td className="text-left">
                  <Badge tone={c.no_arbitrage_flag.passed ? "positive" : "warning"}>{c.no_arbitrage_flag.passed ? "OK" : "FLAG"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
