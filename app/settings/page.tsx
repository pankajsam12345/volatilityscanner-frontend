"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader } from "@/components/ui/Card";

const GROUPS: { title: string; fields: string[] }[] = [
  { title: "Market Conventions", fields: ["risk_free_rate", "dividend_yield", "trading_days_per_year"] },
  { title: "Historical / Percentile Engine", fields: ["historical_lookback_years", "percentile_lookback_days", "zscore_extreme_threshold"] },
  { title: "Liquidity Filter", fields: ["min_open_interest", "min_volume", "max_bid_ask_spread_pct", "high_liquidity_oi", "high_liquidity_volume", "high_liquidity_spread_pct"] },
  {
    title: "Transaction Costs",
    fields: ["brokerage_per_lot", "exchange_fee_pct", "tax_pct", "slippage_vol_points", "market_impact_vol_points", "hedging_cost_vol_points"],
  },
  { title: "Opportunity Thresholds", fields: ["min_net_edge_vol_points", "min_confidence_pct", "max_risk_score"] },
  {
    title: "Score Weights",
    fields: [
      "score_weight_statistical_edge",
      "score_weight_historical_consistency",
      "score_weight_liquidity",
      "score_weight_cost_efficiency",
      "score_weight_model_confidence",
      "score_weight_risk",
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    api.settings().then((s) => {
      setSettings(s);
      const d: Record<string, string> = {};
      for (const [k, v] of Object.entries(s)) {
        if (typeof v === "number") d[k] = String(v);
      }
      setDraft(d);
    });
  };

  useEffect(load, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const patch: Record<string, number> = {};
      for (const [k, v] of Object.entries(draft)) {
        const num = Number(v);
        if (!Number.isNaN(num)) patch[k] = num;
      }
      const updated = await api.updateSettings(patch);
      setSettings(updated);
      setMessage("Saved.");
    } catch (e) {
      setMessage(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p className="text-xs text-zinc-500">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="Settings"
          subtitle="Every threshold used by the analytics/opportunity engine — editable at runtime, applies on the next scan"
          right={
            <button onClick={save} disabled={saving} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          }
        />
        {message && <p className="mb-3 text-xs text-emerald-400">{message}</p>}

        <div className="grid grid-cols-2 gap-4">
          {GROUPS.map((group) => (
            <div key={group.title} className="panel p-3">
              <div className="mb-2 text-xs font-semibold text-zinc-200">{group.title}</div>
              <div className="flex flex-col gap-2">
                {group.fields.map((field) => (
                  <label key={field} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-zinc-500">{field.replace(/_/g, " ")}</span>
                    <input
                      className="input w-28"
                      value={draft[field] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
