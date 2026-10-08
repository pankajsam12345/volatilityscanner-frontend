"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, ApiError } from "@/lib/api";
import type { ExpiryInfo, StrategyAnalysis, StrategyTemplate } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { num, pct, signedNum } from "@/lib/format";

export default function StrategyBuilderPage() {
  const { symbol } = useSymbol();
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [templateKey, setTemplateKey] = useState("straddle");
  const [expiries, setExpiries] = useState<ExpiryInfo[]>([]);
  const [expiry, setExpiry] = useState("");
  const [analysis, setAnalysis] = useState<StrategyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.strategyTemplates().then(setTemplates);
  }, []);

  useEffect(() => {
    api.expiries(symbol).then((rows) => {
      setExpiries(rows);
      setExpiry(rows[0]?.expiry_date ?? "");
    });
  }, [symbol]);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyzeStrategy({ symbol, expiry_date: expiry, template_key: templateKey });
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  // The payoff grid spans 0.02x-2x spot (needed to reliably determine max
  // risk/reward), which is far wider than useful to look at — zoom the
  // chart to a window around the strikes actually involved.
  const strikes = analysis?.legs.map((l) => l.strike) ?? [];
  const center = strikes.length ? strikes.reduce((a, b) => a + b, 0) / strikes.length : 0;
  const chartData = analysis
    ? analysis.payoff_curve
        .filter((p) => p.spot >= center * 0.6 && p.spot <= center * 1.4)
        .map((p) => ({ spot: Math.round(p.spot), pnl: p.pnl }))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={`Strategy Builder — ${symbol}`} subtitle="Templates resolve against today's real option chain. Payoff is at expiry; nothing here is a guarantee." />
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Template</span>
            <select className="input" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
              {templates.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Expiry</span>
            <select className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              {expiries.map((e) => (
                <option key={e.expiry_date} value={e.expiry_date}>{e.expiry_date} ({e.days_to_expiry}d)</option>
              ))}
            </select>
          </label>
          <button onClick={analyze} disabled={loading || !expiry} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>
        {templates.find((t) => t.key === templateKey) && (
          <p className="mt-2 text-[11px] text-zinc-500">{templates.find((t) => t.key === templateKey)!.description}</p>
        )}
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </Card>

      {analysis && (
        <>
          <Card>
            <CardHeader title="Legs" />
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th><th>Type</th><th>Strike</th><th>IV</th><th>Bid</th><th>Ask</th><th>Delta</th><th>Vega</th><th>Theta</th>
                </tr>
              </thead>
              <tbody>
                {analysis.legs.map((leg, i) => (
                  <tr key={i}>
                    <td className={`text-left font-semibold ${leg.action === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{leg.action}</td>
                    <td className="text-left">{leg.option_type}</td>
                    <td className="mono">{leg.strike}</td>
                    <td className="mono">{pct(leg.iv, 1)}</td>
                    <td className="mono">{num(leg.bid)}</td>
                    <td className="mono">{num(leg.ask)}</td>
                    <td className="mono">{num(leg.greeks.delta)}</td>
                    <td className="mono">{num(leg.greeks.vega, 1)}</td>
                    <td className="mono">{num(leg.greeks.theta, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader title="Payoff at Expiry" />
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22262f" />
                    <XAxis dataKey="spot" stroke="#8b93a5" fontSize={11} />
                    <YAxis stroke="#8b93a5" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#151922", border: "1px solid #22262f", fontSize: 12 }} />
                    <ReferenceLine y={0} stroke="#5b6272" />
                    {analysis.breakevens.map((b, i) => (
                      <ReferenceLine key={i} x={Math.round(b)} stroke="#f59e0b" strokeDasharray="3 3" />
                    ))}
                    <Line type="monotone" dataKey="pnl" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <Card>
                <CardHeader title="Risk / Reward" />
                <div className="flex flex-col gap-1.5 text-xs">
                  <Row label="Net Premium" value={signedNum(analysis.net_premium)} />
                  <Row label="Transaction Cost" value={`-${analysis.transaction_cost_cash.toFixed(2)}`} />
                  <Row label="Max Risk" value={analysis.undefined_risk ? "Unlimited" : num(analysis.max_risk)} tone={analysis.undefined_risk ? "warning" : undefined} />
                  <Row label="Max Reward" value={analysis.undefined_reward ? "Unlimited" : num(analysis.max_reward)} tone={analysis.undefined_reward ? "positive" : undefined} />
                  <Row label="Breakevens" value={analysis.breakevens.map((b) => Math.round(b)).join(", ") || "—"} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Portfolio Greeks" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(analysis.greeks).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-zinc-500 uppercase">{k}</div>
                      <div className="mono text-zinc-200">{signedNum(v, 2)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "positive" | "warning" }) {
  const color = tone === "positive" ? "text-emerald-400" : tone === "warning" ? "text-amber-400" : "text-zinc-200";
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-500">{label}</span>
      <span className={`mono font-medium ${color}`}>{value}</span>
    </div>
  );
}
