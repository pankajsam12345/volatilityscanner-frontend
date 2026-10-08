"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ExpiryInfo, PortfolioRisk, StrategyTemplate, WhatIfResult } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader, KpiTile } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { num, signedNum, dateFmt } from "@/lib/format";

export default function PortfolioPage() {
  const { symbol } = useSymbol();
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [templateKey, setTemplateKey] = useState("straddle");
  const [expiries, setExpiries] = useState<ExpiryInfo[]>([]);
  const [expiry, setExpiry] = useState("");
  const [label, setLabel] = useState("");
  const [risk, setRisk] = useState<PortfolioRisk | null>(null);
  const [whatIf, setWhatIf] = useState<WhatIfResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRisk = () => api.portfolioRisk().then(setRisk).catch(() => {});

  useEffect(() => {
    api.strategyTemplates().then(setTemplates);
    loadRisk();
  }, []);
  useEffect(() => {
    api.expiries(symbol).then((rows) => {
      setExpiries(rows);
      setExpiry(rows[0]?.expiry_date ?? "");
    });
  }, [symbol]);

  const addPosition = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.addPosition({ symbol, expiry_date: expiry, label: label || `${templateKey} ${symbol}`, template_key: templateKey, quantity: 1 });
      setLabel("");
      loadRisk();
    } catch (e) {
      setError(e instanceof ApiError ? (e.status === 401 ? "Login required to add a position." : e.message) : String(e));
    } finally {
      setLoading(false);
    }
  };

  const removePosition = async (id: number) => {
    try {
      await api.deletePosition(id);
      loadRisk();
    } catch {
      setError("Login required to close a position.");
    }
  };

  const runWhatIf = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.whatIf({});
      setWhatIf(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const timeShocks = whatIf ? [...new Set(whatIf.cells.map((c) => c.time_shock_days))].sort((a, b) => a - b) : [];
  const spotShocks = whatIf ? [...new Set(whatIf.cells.map((c) => c.spot_shock_pct))].sort((a, b) => a - b) : [];
  const volShocks = whatIf ? [...new Set(whatIf.cells.map((c) => c.vol_shock_pts))].sort((a, b) => a - b) : [];
  const [shownTimeShock, setShownTimeShock] = useState<number | null>(null);
  const activeTimeShock = shownTimeShock ?? timeShocks[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Portfolio" subtitle="Demo positions saved from the Strategy Builder. Portfolio-level Greeks and a parametric VaR/CVaR estimate." />
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
          <Field label="Label">
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={`${templateKey} ${symbol}`} />
          </Field>
          <button onClick={addPosition} disabled={loading || !expiry} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            Add to Portfolio
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </Card>

      <div className="grid grid-cols-4 gap-3">
        <KpiTile label="Open Positions" value={String(risk?.positions.length ?? 0)} />
        <KpiTile label="VaR 95% (1-day, parametric)" value={risk ? num(risk.var_95) : "—"} tone="negative" />
        <KpiTile label="CVaR 95% (Expected Shortfall)" value={risk ? num(risk.cvar_95) : "—"} tone="negative" />
        <KpiTile label="Net Delta" value={risk ? num(risk.aggregated_greeks.delta) : "—"} />
      </div>

      <Card>
        <CardHeader title="Aggregated Greeks" />
        <div className="grid grid-cols-4 gap-3 text-xs sm:grid-cols-8">
          {risk && Object.entries(risk.aggregated_greeks).map(([k, v]) => (
            <div key={k}>
              <div className="text-zinc-500 uppercase">{k}</div>
              <div className="mono text-zinc-200">{signedNum(v, 2)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Positions" />
        <table className="data-table">
          <thead><tr><th>Label</th><th>Symbol</th><th>Legs</th><th>Qty</th><th>Opened</th><th></th></tr></thead>
          <tbody>
            {risk?.positions.map((p) => (
              <tr key={p.id}>
                <td className="text-left">{p.label}</td>
                <td className="text-left"><Badge>{p.symbol}</Badge></td>
                <td className="text-left">{p.legs.map((l) => `${l.action} ${l.option_type} ${l.strike}`).join(", ")}</td>
                <td className="mono">{p.quantity}</td>
                <td className="text-zinc-500">{dateFmt(p.opened_at)}</td>
                <td className="text-left">
                  <button onClick={() => removePosition(p.id)} className="text-red-400 hover:underline">Close</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader
          title="What-If Simulator"
          subtitle="Spot / vol / time shock grid applied to the current aggregated portfolio Greeks"
          right={
            <button onClick={runWhatIf} disabled={loading} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              Run What-If
            </button>
          }
        />
        {whatIf && (
          <>
            <div className="mb-3 flex gap-1">
              {timeShocks.map((t) => (
                <button key={t} onClick={() => setShownTimeShock(t)} className={`rounded px-2 py-1 text-xs ${activeTimeShock === t ? "bg-blue-600/20 text-blue-300" : "text-zinc-400 hover:bg-zinc-800"}`}>
                  +{t}d
                </button>
              ))}
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Spot \ Vol</th>
                  {volShocks.map((v) => <th key={v}>{v > 0 ? "+" : ""}{v} vol pt</th>)}
                </tr>
              </thead>
              <tbody>
                {spotShocks.map((s) => (
                  <tr key={s}>
                    <td className="text-left font-medium">{(s * 100).toFixed(0)}%</td>
                    {volShocks.map((v) => {
                      const cell = whatIf.cells.find((c) => c.spot_shock_pct === s && c.vol_shock_pts === v && c.time_shock_days === activeTimeShock);
                      const pnl = cell?.pnl ?? 0;
                      return <td key={v} className={`mono ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{signedNum(pnl)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
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
