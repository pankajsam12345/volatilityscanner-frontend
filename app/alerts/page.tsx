"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { AlertEvent, AlertRule } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { num, timeFmt } from "@/lib/format";

const METRICS = [
  "atm_iv", "atm_iv_zscore", "iv_rv_zscore", "rv20",
  "skew_25_zscore", "rr_25_zscore", "bf_25_zscore", "calendar_spread_zscore", "forward_vol_zscore",
];

export default function AlertsPage() {
  const { symbol } = useSymbol();
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [metric, setMetric] = useState("atm_iv_zscore");
  const [bucket, setBucket] = useState("1M");
  const [condition, setCondition] = useState(">");
  const [threshold, setThreshold] = useState("2.0");
  const [channel, setChannel] = useState("WEB");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api.listAlerts(symbol).then(setAlerts).catch(() => {});
    api.alertEvents().then(setEvents).catch(() => {});
  };

  useEffect(load, [symbol]);

  const create = async () => {
    setError(null);
    try {
      await api.createAlert({
        symbol, metric, bucket, condition, threshold: Number(threshold), channel,
        webhook_url: channel === "WEBHOOK" ? webhookUrl : null,
        recipient: channel === "EMAIL" || channel === "TELEGRAM" ? recipient : null,
      });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? (e.status === 401 ? "Login required to create an alert." : e.message) : String(e));
    }
  };

  const remove = async (id: number) => {
    try {
      await api.deleteAlert(id);
      load();
    } catch {
      setError("Login required to delete an alert.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={`Alerts — ${symbol}`} subtitle="All alerts are evaluated by a Celery periodic task; Webhook/Email/Telegram additionally deliver to your configured target. Fires once per condition-become-true transition." />
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <Field label="Metric">
            <select className="input" value={metric} onChange={(e) => setMetric(e.target.value)}>
              {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Bucket">
            <input className="input" value={bucket} onChange={(e) => setBucket(e.target.value)} placeholder="1M, 1M_3M, or blank" />
          </Field>
          <Field label="Condition">
            <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
            </select>
          </Field>
          <Field label="Threshold">
            <input className="input w-24" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </Field>
          <Field label="Channel">
            <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="WEB">Web</option>
              <option value="WEBHOOK">Webhook</option>
              <option value="EMAIL">Email</option>
              <option value="TELEGRAM">Telegram</option>
            </select>
          </Field>
          {channel === "WEBHOOK" && (
            <Field label="Webhook URL">
              <input className="input w-56" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
            </Field>
          )}
          {channel === "EMAIL" && (
            <Field label="Email address">
              <input className="input w-56" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="you@example.com" />
            </Field>
          )}
          {channel === "TELEGRAM" && (
            <Field label="Telegram chat ID">
              <input className="input w-40" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="123456789" />
            </Field>
          )}
          <button onClick={create} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
            Create Alert
          </button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          Metrics ending in <code className="mono">_zscore</code> compare the current reading&apos;s z-score vs its own history
          (matches the threshold conventions used elsewhere, e.g. z-score &gt; 2). Others compare the raw value directly.
          Email delivery requires SMTP settings and Telegram requires a bot token to be configured on the backend
          (<code className="mono">SMTP_HOST</code> / <code className="mono">TELEGRAM_BOT_TOKEN</code>) — if unconfigured, the alert
          still fires and is logged, delivery is just skipped.
        </p>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </Card>

      <Card>
        <CardHeader title="Active Alerts" />
        <table className="data-table">
          <thead><tr><th>Symbol</th><th>Metric</th><th>Bucket</th><th>Condition</th><th>Channel</th><th>Currently Met</th><th>Last Triggered</th><th></th></tr></thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td className="text-left"><Badge>{a.symbol}</Badge></td>
                <td className="text-left">{a.metric}</td>
                <td className="text-left">{a.bucket || "—"}</td>
                <td className="mono">{a.condition} {num(a.threshold)}</td>
                <td className="text-left"><Badge tone={a.channel === "WEB" ? "neutral" : "info"}>{a.channel}</Badge></td>
                <td className="text-left"><Badge tone={a.currently_met ? "warning" : "neutral"}>{a.currently_met ? "YES" : "no"}</Badge></td>
                <td className="text-zinc-500">{a.last_triggered_at ? timeFmt(a.last_triggered_at) : "never"}</td>
                <td className="text-left"><button onClick={() => remove(a.id)} className="text-red-400 hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader title="Recent Events" />
        <table className="data-table">
          <thead><tr><th>Triggered At</th><th>Observed Value</th><th>Message</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td className="text-left">{timeFmt(e.triggered_at)}</td>
                <td className="mono">{num(e.observed_value)}</td>
                <td className="text-left text-zinc-300">{e.message}</td>
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
