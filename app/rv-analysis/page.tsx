"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import type { RealizedVolResponse, VolatilityResponse } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ZscorePill, PercentileBar } from "@/components/ui/ZscorePill";
import { pct, num } from "@/lib/format";

const ESTIMATORS = ["CLOSE_CLOSE", "PARKINSON", "GARMAN_KLASS", "ROGERS_SATCHELL", "YANG_ZHANG"];
const WINDOWS = [5, 10, 20, 30, 60, 90, 252];

export default function RvAnalysisPage() {
  const { symbol } = useSymbol();
  const [vol, setVol] = useState<VolatilityResponse | null>(null);
  const [rv, setRv] = useState<RealizedVolResponse | null>(null);
  const [estimator, setEstimator] = useState("CLOSE_CLOSE");

  useEffect(() => {
    api.volatility(symbol).then(setVol);
  }, [symbol]);

  useEffect(() => {
    api.realizedVol(symbol, estimator).then(setRv);
  }, [symbol, estimator]);

  const rv20Series = rv?.series["hv_20"] ?? [];
  const chartData = rv20Series.map((p) => ({ date: new Date(p.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), rv20: p.value * 100 }));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={`IV vs RV — ${symbol}`}
          subtitle="ATM IV per expiry vs realized volatility, with IV-RV spread/ratio and historical context"
          right={
            <select value={estimator} onChange={(e) => setEstimator(e.target.value)} className="mono rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100">
              {ESTIMATORS.map((e) => (
                <option key={e} value={e}>
                  {e.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          }
        />

        <div className="mb-4 grid grid-cols-7 gap-2">
          {WINDOWS.map((w) => (
            <div key={w} className="panel px-2 py-1.5 text-center">
              <div className="text-[10px] text-zinc-500">HV{w}</div>
              <div className="mono text-sm text-zinc-200">{pct(rv?.latest[`hv_${w}`] ?? null)}</div>
            </div>
          ))}
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#22262f" />
              <XAxis dataKey="date" stroke="#8b93a5" fontSize={10} minTickGap={30} />
              <YAxis stroke="#8b93a5" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "#151922", border: "1px solid #22262f", fontSize: 12 }} />
              <Line type="monotone" dataKey="rv20" name="RV20" stroke="#22c55e" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Per-Expiry IV vs RV20" />
        <table className="data-table">
          <thead>
            <tr>
              <th>Expiry</th>
              <th>Tenor</th>
              <th>ATM IV</th>
              <th>ATM IV Z-score</th>
              <th>ATM IV Percentile</th>
              <th>IV-RV20 Spread (vol pts)</th>
              <th>IV/RV20 Ratio</th>
            </tr>
          </thead>
          <tbody>
            {vol?.expiries.map((e) => (
              <tr key={e.expiry_date}>
                <td className="text-left">{e.expiry_date}</td>
                <td className="text-left"><Badge>{e.tenor_label}</Badge></td>
                <td className="mono">{pct(e.atm_iv)}</td>
                <td><ZscorePill z={e.atm_iv_history.zscore} /></td>
                <td><PercentileBar p={e.atm_iv_history.percentile} /></td>
                <td className={`mono ${e.iv_rv_20_spread && e.iv_rv_20_spread > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {e.iv_rv_20_spread !== null ? num(e.iv_rv_20_spread * 100) : "—"}
                </td>
                <td className="mono">{e.iv_rv_20_ratio !== null ? e.iv_rv_20_ratio.toFixed(2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
