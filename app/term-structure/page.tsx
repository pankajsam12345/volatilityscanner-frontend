"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import type { TermStructureResponse } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ZscorePill, PercentileBar } from "@/components/ui/ZscorePill";
import { pct, num } from "@/lib/format";

export default function TermStructurePage() {
  const { symbol } = useSymbol();
  const [data, setData] = useState<TermStructureResponse | null>(null);

  useEffect(() => {
    api.termStructure(symbol).then(setData);
  }, [symbol]);

  const chartData =
    data?.curve.map((c) => ({
      tenor: c.tenor_label,
      atmIv: c.atm_iv !== null ? c.atm_iv * 100 : null,
      forwardVol: c.forward_vol_from_prev?.valid ? (c.forward_vol_from_prev.value as number) * 100 : null,
    })) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={`Term Structure — ${symbol}`}
          subtitle="ATM IV and forward volatility across expiries"
          right={
            data?.regime && (
              <Badge tone={data.regime === "MIXED" ? "warning" : "info"}>{data.regime}</Badge>
            )
          }
        />
        <div className="mb-4 flex gap-6 text-xs text-zinc-400">
          <span>Slope: <span className="mono text-zinc-200">{num(data?.slope, 4)}</span></span>
          <span>Curvature: <span className="mono text-zinc-200">{num(data?.curvature, 4)}</span></span>
          <span>Local inversions: <span className="mono text-zinc-200">{data?.local_inversions_at_tenor_years.length ?? 0}</span></span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#22262f" />
              <XAxis dataKey="tenor" stroke="#8b93a5" fontSize={11} />
              <YAxis stroke="#8b93a5" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "#151922", border: "1px solid #22262f", fontSize: 12 }} />
              <Line type="monotone" dataKey="atmIv" name="ATM IV" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="forwardVol" name="Forward Vol" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Expiry Detail" />
        <table className="data-table">
          <thead>
            <tr>
              <th>Expiry</th>
              <th>Tenor</th>
              <th>DTE</th>
              <th>ATM IV</th>
              <th>Z-score</th>
              <th>Percentile</th>
              <th>Forward Vol (prev→this)</th>
            </tr>
          </thead>
          <tbody>
            {data?.curve.map((c) => (
              <tr key={c.expiry_date}>
                <td className="text-left">{c.expiry_date}</td>
                <td className="text-left"><Badge>{c.tenor_label}</Badge></td>
                <td>{c.days_to_expiry}</td>
                <td className="mono">{pct(c.atm_iv)}</td>
                <td><ZscorePill z={c.atm_iv_history.zscore} /></td>
                <td><PercentileBar p={c.atm_iv_history.percentile} /></td>
                <td className="mono">
                  {c.forward_vol_from_prev ? (c.forward_vol_from_prev.valid ? pct(c.forward_vol_from_prev.value) : <span className="text-amber-400">invalid</span>) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
