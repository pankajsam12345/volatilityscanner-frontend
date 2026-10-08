"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, ApiError } from "@/lib/api";
import type { BacktestRunDetail, BacktestSummary, StrategyTemplate } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { num, signedNum, dateFmt, edgeColor } from "@/lib/format";
import { useAuth } from "@/components/AuthContext";

const SIGNAL_TYPES = ["IV_RV", "CALENDAR", "FORWARD_VOL", "SKEW", "RR", "BF"];

export default function BacktestPage() {
  const { symbol } = useSymbol();
  const { username } = useAuth();
  const [replayMode, setReplayMode] = useState<"SIGNAL" | "CHAIN">("SIGNAL");
  const [signalType, setSignalType] = useState("IV_RV");
  const [bucket, setBucket] = useState("1M");
  const [entryZ, setEntryZ] = useState("2.0");
  const [exitZ, setExitZ] = useState("0.5");
  const [maxHolding, setMaxHolding] = useState("20");
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [templateKey, setTemplateKey] = useState("straddle");
  const [result, setResult] = useState<BacktestRunDetail | null>(null);
  const [history, setHistory] = useState<BacktestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = () => api.listBacktests(symbol).then(setHistory).catch(() => {});

  useEffect(() => {
    loadHistory();
  }, [symbol]);

  useEffect(() => {
    api.strategyTemplates().then(setTemplates);
  }, []);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.runBacktest({
        symbol, signal_type: signalType, bucket, replay_mode: replayMode,
        entry_zscore: Number(entryZ), exit_zscore: Number(exitZ), max_holding_days: Number(maxHolding),
        ...(replayMode === "CHAIN" ? { template_key: templateKey } : {}),
      });
      setResult(r);
      loadHistory();
    } catch (e) {
      setError(e instanceof ApiError ? (e.status === 401 ? "Login required to run a backtest." : e.message) : String(e));
    } finally {
      setLoading(false);
    }
  };

  const chartData = result?.equity_curve.map((p) => ({ date: dateFmt(p.date), pnl: p.cumulative_pnl })) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={`Backtest — ${symbol}`}
          subtitle={
            replayMode === "SIGNAL"
              ? "Walk-forward, cost-adjusted signal backtest over the seeded historical distribution. Not a full option-chain P&L replay."
              : "Same walk-forward entry/exit timing, but marks a real multi-leg strategy to market against real historical option chains (a single rolling near-month expiry per day — see README)."
          }
        />
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <Field label="Mode">
            <select className="input" value={replayMode} onChange={(e) => setReplayMode(e.target.value as "SIGNAL" | "CHAIN")}>
              <option value="SIGNAL">Signal</option>
              <option value="CHAIN">Option-Chain Replay</option>
            </select>
          </Field>
          <Field label="Signal">
            <select className="input" value={signalType} onChange={(e) => setSignalType(e.target.value)}>
              {SIGNAL_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <Field label="Bucket">
            <input className="input" value={bucket} onChange={(e) => setBucket(e.target.value)} placeholder="1M or 1M_3M or 1M:25" />
          </Field>
          {replayMode === "CHAIN" && (
            <Field label="Strategy">
              <select className="input" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
                {templates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Field>
          )}
          <Field label="Entry Z">
            <input className="input w-20" value={entryZ} onChange={(e) => setEntryZ(e.target.value)} />
          </Field>
          <Field label="Exit Z">
            <input className="input w-20" value={exitZ} onChange={(e) => setExitZ(e.target.value)} />
          </Field>
          <Field label="Max Hold (days)">
            <input className="input w-20" value={maxHolding} onChange={(e) => setMaxHolding(e.target.value)} />
          </Field>
          <button onClick={runBacktest} disabled={loading} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {loading ? "Running…" : "Run Backtest"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          Bucket format: tenor label for IV-RV (e.g. <code className="mono">1M</code>), near_far for Calendar/Forward Vol
          (e.g. <code className="mono">1M_3M</code>), or tenor:delta for Skew/RR/BF (e.g. <code className="mono">1M:25</code>).
          {replayMode === "CHAIN" && " A SHORT window trades the strategy as configured (straddle/strangle default to selling — rich vol); a LONG window automatically trades the structurally opposite position (every leg's action inverted) with the same strikes."}
          {!username && " Running a backtest requires login (top right)."}
        </p>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Trades" value={String(result.summary.num_trades)} />
            <Stat label="Win Rate" value={result.summary.win_rate !== null ? `${result.summary.win_rate.toFixed(0)}%` : "—"} />
            <Stat label="Total P&L (vol pts)" value={signedNum(result.summary.total_pnl)} tone={edgeColor(result.summary.total_pnl)} />
            <Stat label="Sharpe (annualized)" value={num(result.summary.sharpe)} />
            <Stat label="Max Drawdown" value={num(result.summary.max_drawdown)} />
            <Stat label="Profit Factor" value={result.summary.profit_factor !== null ? num(result.summary.profit_factor) : "No losses"} />
            <Stat label="Tail Loss (P5)" value={signedNum(result.summary.tail_loss_p5)} />
            <Stat label="Avg / Median Return" value={`${signedNum(result.summary.avg_return)} / ${signedNum(result.summary.median_return)}`} />
          </div>

          <Card>
            <CardHeader title="Equity Curve" />
            <div className="h-56 w-full">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22262f" />
                  <XAxis dataKey="date" stroke="#8b93a5" fontSize={10} minTickGap={40} />
                  <YAxis stroke="#8b93a5" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#151922", border: "1px solid #22262f", fontSize: 12 }} />
                  <Line type="monotone" dataKey="pnl" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Regime Breakdown" />
            <table className="data-table">
              <thead><tr><th>Regime</th><th>Trades</th><th>Win Rate</th><th>Total P&L</th><th>Avg Return</th></tr></thead>
              <tbody>
                {Object.entries(result.regime_breakdown).map(([regime, s]) => (
                  <tr key={regime}>
                    <td className="text-left"><Badge>{regime}</Badge></td>
                    <td className="mono">{s.num_trades}</td>
                    <td className="mono">{s.win_rate !== null ? `${s.win_rate.toFixed(0)}%` : "—"}</td>
                    <td className={`mono ${edgeColor(s.total_pnl)}`}>{signedNum(s.total_pnl)}</td>
                    <td className="mono">{signedNum(s.avg_return)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <CardHeader title="Trades" />
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entry</th><th>Exit</th><th>Dir</th><th>Entry Val</th><th>Exit Val</th><th>Entry Z</th><th>Hold (d)</th><th>Gross</th><th>Cost</th><th>Net</th><th>Regime</th>
                  {result.replay_mode === "CHAIN" && <th>Legs</th>}
                </tr>
              </thead>
              <tbody>
                {result.trades.map((t, i) => (
                  <tr key={i}>
                    <td className="text-left">{dateFmt(t.entry_date)}</td>
                    <td className="text-left">{dateFmt(t.exit_date)}</td>
                    <td className="text-left"><Badge tone={t.direction === "SHORT" ? "warning" : "info"}>{t.direction}</Badge></td>
                    <td className="mono">{num(t.entry_value)}</td>
                    <td className="mono">{num(t.exit_value)}</td>
                    <td className="mono">{num(t.entry_zscore)}</td>
                    <td className="mono">{t.holding_days}</td>
                    <td className="mono">{signedNum(t.gross_pnl)}</td>
                    <td className="mono text-zinc-500">-{t.transaction_cost.toFixed(2)}</td>
                    <td className={`mono font-semibold ${edgeColor(t.net_pnl)}`}>{signedNum(t.net_pnl)}</td>
                    <td className="text-left"><Badge>{t.regime_at_entry}</Badge></td>
                    {result.replay_mode === "CHAIN" && (
                      <td className="text-left text-[11px] text-zinc-400">
                        {t.legs?.map((l, li) => (
                          <div key={li} className="whitespace-nowrap">
                            <span className={l.action === "BUY" ? "text-emerald-400" : "text-red-400"}>{l.action}</span>{" "}
                            {l.quantity}x {l.option_type} {l.strike} ({num(l.entry_price)}→{num(l.exit_price)})
                          </div>
                        )) ?? "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <Card>
        <CardHeader title="Past Runs" />
        <table className="data-table">
          <thead><tr><th>Mode</th><th>Signal</th><th>Bucket</th><th>Trades</th><th>Win Rate</th><th>Total P&L</th><th>Run At</th></tr></thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="cursor-pointer" onClick={() => api.getBacktest(h.id).then(setResult)}>
                <td className="text-left"><Badge tone={h.replay_mode === "CHAIN" ? "info" : "neutral"}>{h.replay_mode}</Badge></td>
                <td className="text-left"><Badge>{h.signal_type}</Badge></td>
                <td className="text-left">{h.bucket}</td>
                <td className="mono">{h.summary.num_trades}</td>
                <td className="mono">{h.summary.win_rate !== null ? `${h.summary.win_rate.toFixed(0)}%` : "—"}</td>
                <td className={`mono ${edgeColor(h.summary.total_pnl)}`}>{signedNum(h.summary.total_pnl)}</td>
                <td className="text-zinc-500">{dateFmt(h.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="panel px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mono text-lg font-semibold ${tone ?? "text-zinc-100"}`}>{value}</div>
    </div>
  );
}
