"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, ApiError } from "@/lib/api";
import type { ExpiryInfo, HedgeSimulationResult, MonteCarloResult, StrategyTemplate } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader, KpiTile } from "@/components/ui/Card";
import { num, signedNum } from "@/lib/format";

const FREQUENCIES = ["daily", "hourly", "30min", "15min", "5min"];

export default function SimulatorPage() {
  const { symbol } = useSymbol();
  const [tab, setTab] = useState<"hedge" | "montecarlo">("hedge");
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [templateKey, setTemplateKey] = useState("straddle");
  const [expiries, setExpiries] = useState<ExpiryInfo[]>([]);
  const [expiry, setExpiry] = useState("");

  const [numDays, setNumDays] = useState("20");
  const [frequency, setFrequency] = useState("daily");
  const [hedgeResult, setHedgeResult] = useState<HedgeSimulationResult | null>(null);

  const [horizonDays, setHorizonDays] = useState("20");
  const [numPaths, setNumPaths] = useState("2000");
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);

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

  const runHedge = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.simulateHedge({ symbol, expiry_date: expiry, template_key: templateKey, num_days: Number(numDays), rehedge_frequency: frequency });
      setHedgeResult(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const runMonteCarlo = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.simulateMonteCarlo({ symbol, expiry_date: expiry, template_key: templateKey, horizon_days: Number(horizonDays), num_paths: Number(numPaths) });
      setMcResult(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // The backend returns each day's OWN P&L slice, not a running total —
  // accumulate here so the chart shows the cumulative curve its title promises.
  const cumulativeChartData = (() => {
    if (!hedgeResult) return [];
    let netCum = 0, gammaCum = 0, thetaCum = 0, vegaCum = 0;
    return hedgeResult.cumulative.map((d) => {
      netCum += d.net_pnl;
      gammaCum += d.gamma_pnl;
      thetaCum += d.theta_pnl;
      vegaCum += d.vega_pnl;
      return { day: d.day, net_pnl: netCum, gamma_pnl: gammaCum, theta_pnl: thetaCum, vega_pnl: vegaCum };
    });
  })();

  const histogram = mcResult
    ? (() => {
        const sorted = [...mcResult.pnl_distribution_sample].sort((a, b) => a - b);
        const bins = 30;
        const min = sorted[0], max = sorted[sorted.length - 1];
        const width = (max - min) / bins || 1;
        const counts = new Array(bins).fill(0);
        for (const v of sorted) {
          const idx = Math.min(bins - 1, Math.floor((v - min) / width));
          counts[idx]++;
        }
        return counts.map((count, i) => ({ bucket: Math.round(min + i * width), count }));
      })()
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={`Trade Simulator — ${symbol}`} subtitle="Delta-hedge P&L attribution and Monte Carlo P&L distribution. All figures are model-based estimates, not guarantees." />
        <div className="mb-4 flex gap-1">
          <button onClick={() => setTab("hedge")} className={`rounded px-3 py-1.5 text-xs font-medium ${tab === "hedge" ? "bg-blue-600/20 text-blue-300" : "text-zinc-400 hover:bg-zinc-800"}`}>Delta-Hedge Simulator</button>
          <button onClick={() => setTab("montecarlo")} className={`rounded px-3 py-1.5 text-xs font-medium ${tab === "montecarlo" ? "bg-blue-600/20 text-blue-300" : "text-zinc-400 hover:bg-zinc-800"}`}>Monte Carlo</button>
        </div>

        <div className="flex flex-wrap items-end gap-3 text-xs">
          <Field label="Template">
            <select className="input" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
              {templates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Expiry">
            <select className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              {expiries.map((e) => <option key={e.expiry_date} value={e.expiry_date}>{e.expiry_date} ({e.days_to_expiry}d)</option>)}
            </select>
          </Field>

          {tab === "hedge" ? (
            <>
              <Field label="Rehedge Frequency">
                <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Days">
                <input className="input w-20" value={numDays} onChange={(e) => setNumDays(e.target.value)} />
              </Field>
              <button onClick={runHedge} disabled={loading || !expiry} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                {loading ? "Simulating…" : "Simulate"}
              </button>
            </>
          ) : (
            <>
              <Field label="Horizon (days)">
                <input className="input w-20" value={horizonDays} onChange={(e) => setHorizonDays(e.target.value)} />
              </Field>
              <Field label="Paths">
                <input className="input w-24" value={numPaths} onChange={(e) => setNumPaths(e.target.value)} />
              </Field>
              <button onClick={runMonteCarlo} disabled={loading || !expiry} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                {loading ? "Simulating…" : "Run Monte Carlo"}
              </button>
            </>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </Card>

      {tab === "hedge" && hedgeResult && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <KpiTile label="Gross P&L" value={signedNum(hedgeResult.totals.gross_pnl)} />
            <KpiTile label="Transaction Cost" value={`-${hedgeResult.totals.transaction_cost.toFixed(2)}`} />
            <KpiTile label="Net P&L" value={signedNum(hedgeResult.totals.net_pnl)} tone={hedgeResult.totals.net_pnl >= 0 ? "positive" : "negative"} />
            <KpiTile label="Rehedge Frequency" value={hedgeResult.rehedge_frequency} />
          </div>
          <Card>
            <CardHeader title="Cumulative P&L Attribution" subtitle="Frozen-Greeks 2nd-order Taylor decomposition per simulated day" />
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <LineChart data={cumulativeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22262f" />
                  <XAxis dataKey="day" stroke="#8b93a5" fontSize={11} />
                  <YAxis stroke="#8b93a5" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#151922", border: "1px solid #22262f", fontSize: 12 }} />
                  <Line type="monotone" dataKey="net_pnl" name="Net P&L" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="gamma_pnl" name="Gamma P&L" stroke="#22c55e" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="theta_pnl" name="Theta P&L" stroke="#ef4444" strokeWidth={1} dot={false} />
                  <Line type="monotone" dataKey="vega_pnl" name="Vega P&L" stroke="#f59e0b" strokeWidth={1} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {tab === "montecarlo" && mcResult && (
        <>
          <div className="grid grid-cols-5 gap-3">
            <KpiTile label="Mean P&L" value={signedNum(mcResult.mean_pnl)} tone={mcResult.mean_pnl >= 0 ? "positive" : "negative"} />
            <KpiTile label="VaR 95%" value={num(mcResult.var_95)} tone="negative" />
            <KpiTile label="CVaR 95% (Expected Shortfall)" value={num(mcResult.cvar_95)} tone="negative" />
            <KpiTile label="P(Profit)" value={`${mcResult.prob_profit.toFixed(1)}%`} tone="positive" />
            <KpiTile label="P(Loss)" value={`${mcResult.prob_loss.toFixed(1)}%`} tone="negative" />
          </div>
          <Card>
            <CardHeader title="P&L Distribution" subtitle={`${mcResult.num_paths} simulated paths, ${mcResult.horizon_days}-day horizon — model-based estimate`} />
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={histogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22262f" />
                  <XAxis dataKey="bucket" stroke="#8b93a5" fontSize={10} />
                  <YAxis stroke="#8b93a5" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#151922", border: "1px solid #22262f", fontSize: 12 }} />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
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
