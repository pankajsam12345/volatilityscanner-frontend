"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import type { ButterflyResponse, RiskReversalResponse, SkewResponse } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ZscorePill, PercentileBar } from "@/components/ui/ZscorePill";
import { pct, num } from "@/lib/format";

type Tab = "skew" | "rr" | "bf";

export default function SkewPage() {
  const { symbol } = useSymbol();
  const [tab, setTab] = useState<Tab>("skew");
  const [skew, setSkew] = useState<SkewResponse | null>(null);
  const [rr, setRr] = useState<RiskReversalResponse | null>(null);
  const [bf, setBf] = useState<ButterflyResponse | null>(null);
  const [expiryIdx, setExpiryIdx] = useState(0);

  useEffect(() => {
    setExpiryIdx(0);
    api.skew(symbol).then(setSkew);
    api.riskReversal(symbol).then(setRr);
    api.butterfly(symbol).then(setBf);
  }, [symbol]);

  const skewExpiry = skew?.expiries[expiryIdx];
  const rrExpiry = rr?.expiries[expiryIdx];
  const bfExpiry = bf?.expiries[expiryIdx];

  const smileChart =
    skewExpiry?.buckets
      .slice()
      .sort((a, b) => a.delta - b.delta)
      .flatMap((b) => [
        { x: -b.delta, iv: b.put_iv !== null ? b.put_iv * 100 : null },
        { x: b.delta, iv: b.call_iv !== null ? b.call_iv * 100 : null },
      ])
      .sort((a, b) => a.x - b.x) ?? [];
  if (skewExpiry?.atm_iv !== undefined && skewExpiry?.atm_iv !== null) {
    smileChart.splice(smileChart.findIndex((p) => p.x >= 0), 0, { x: 0, iv: skewExpiry.atm_iv * 100 });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={`Skew Dashboard — ${symbol}`}
          subtitle="25Δ put / ATM / 25Δ call, Risk Reversal, and Butterfly with historical context"
          right={
            <select
              value={expiryIdx}
              onChange={(e) => setExpiryIdx(Number(e.target.value))}
              className="mono rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
            >
              {skew?.expiries.map((e, i) => (
                <option key={e.expiry_date} value={i}>
                  {e.tenor_label} · {e.expiry_date}
                </option>
              ))}
            </select>
          }
        />

        <div className="mb-4 flex gap-1">
          {(["skew", "rr", "bf"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-3 py-1.5 text-xs font-medium ${tab === t ? "bg-blue-600/20 text-blue-300" : "text-zinc-400 hover:bg-zinc-800"}`}
            >
              {t === "skew" ? "Skew" : t === "rr" ? "Risk Reversal" : "Butterfly"}
            </button>
          ))}
        </div>

        {tab === "skew" && (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={smileChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22262f" />
                <XAxis dataKey="x" stroke="#8b93a5" fontSize={11} tickFormatter={(v) => (v === 0 ? "ATM" : `${v}Δ`)} />
                <YAxis stroke="#8b93a5" fontSize={11} unit="%" domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "#151922", border: "1px solid #22262f", fontSize: 12 }} />
                <Line type="monotone" dataKey="iv" name="IV" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === "skew" && skewExpiry && (
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Δ</th>
                <th>Put IV</th>
                <th>Call IV</th>
                <th>Put Wing</th>
                <th>Call Wing</th>
                <th>Put-Call Skew</th>
                <th>Put Wing Z</th>
                <th>Put Wing %ile</th>
              </tr>
            </thead>
            <tbody>
              {skewExpiry.buckets.map((b) => (
                <tr key={b.delta}>
                  <td className="text-left"><Badge>{b.delta}Δ</Badge></td>
                  <td className="mono">{pct(b.put_iv)}</td>
                  <td className="mono">{pct(b.call_iv)}</td>
                  <td className="mono">{num(b.put_wing !== null ? b.put_wing * 100 : null)}</td>
                  <td className="mono">{num(b.call_wing !== null ? b.call_wing * 100 : null)}</td>
                  <td className="mono">{num(b.put_call_skew !== null ? b.put_call_skew * 100 : null)}</td>
                  <td><ZscorePill z={b.put_wing_history.zscore} /></td>
                  <td><PercentileBar p={b.put_wing_history.percentile} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "rr" && rrExpiry && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Δ</th>
                <th>RR (vol pts)</th>
                <th>Historical Mean</th>
                <th>Z-score</th>
                <th>Percentile</th>
              </tr>
            </thead>
            <tbody>
              {rrExpiry.buckets.map((b) => (
                <tr key={b.delta}>
                  <td className="text-left"><Badge>{b.delta}Δ</Badge></td>
                  <td className="mono">{num(b.rr !== null ? b.rr * 100 : null)}</td>
                  <td className="mono">{num(b.history.mean)}</td>
                  <td><ZscorePill z={b.history.zscore} /></td>
                  <td><PercentileBar p={b.history.percentile} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "bf" && bfExpiry && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Δ</th>
                <th>BF (vol pts)</th>
                <th>Historical Mean</th>
                <th>Z-score</th>
                <th>Percentile</th>
                <th>Convexity</th>
              </tr>
            </thead>
            <tbody>
              {bfExpiry.buckets.map((b) => (
                <tr key={b.delta}>
                  <td className="text-left"><Badge>{b.delta}Δ</Badge></td>
                  <td className="mono">{num(b.bf !== null ? b.bf * 100 : null)}</td>
                  <td className="mono">{num(b.history.mean)}</td>
                  <td><ZscorePill z={b.history.zscore} /></td>
                  <td><PercentileBar p={b.history.percentile} /></td>
                  <td className="text-left">
                    <Badge tone={b.convexity_flag.passed ? "positive" : "warning"}>{b.convexity_flag.passed ? "OK" : "FLAG"}</Badge>
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
