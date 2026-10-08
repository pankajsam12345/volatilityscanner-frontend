"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ExpiryInfo, OptionChainResponse } from "@/lib/types";
import { useSymbol } from "@/components/SymbolContext";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { pct, num, intFmt } from "@/lib/format";

export default function OptionChainPage() {
  const { symbol } = useSymbol();
  const [expiries, setExpiries] = useState<ExpiryInfo[]>([]);
  const [expiry, setExpiry] = useState<string>("");
  const [chain, setChain] = useState<OptionChainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .expiries(symbol)
      .then((rows) => {
        setExpiries(rows);
        setExpiry(rows[0]?.expiry_date ?? "");
      })
      .catch((e) => setError(String(e)));
  }, [symbol]);

  useEffect(() => {
    if (!expiry) return;
    api.optionChain(symbol, expiry).then(setChain).catch((e) => setError(String(e)));
  }, [symbol, expiry]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={`Option Chain — ${symbol}`}
          subtitle={chain ? `Spot ${chain.spot_price.toLocaleString("en-IN", { maximumFractionDigits: 2 })} · ATM IV ${pct(chain.atm_iv)}` : undefined}
          right={
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="mono rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
            >
              {expiries.map((e) => (
                <option key={e.expiry_date} value={e.expiry_date}>
                  {e.expiry_date} ({e.days_to_expiry}d)
                </option>
              ))}
            </select>
          }
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        {chain && (
          <table className="data-table">
            <thead>
              <tr>
                <th>OI</th>
                <th>Vol</th>
                <th>IV</th>
                <th>Delta</th>
                <th>Gamma</th>
                <th>Vega</th>
                <th>Theta</th>
                <th>Bid</th>
                <th>Ask</th>
                <th className="text-center">Strike</th>
                <th>Bid</th>
                <th>Ask</th>
                <th>Theta</th>
                <th>Vega</th>
                <th>Gamma</th>
                <th>Delta</th>
                <th>IV</th>
                <th>Vol</th>
                <th>OI</th>
              </tr>
            </thead>
            <tbody>
              {chain.rows.map((row) => (
                <tr key={row.strike} className={row.is_atm ? "bg-blue-500/10" : ""}>
                  <td>{intFmt(row.call?.open_interest)}</td>
                  <td>{intFmt(row.call?.volume)}</td>
                  <td className={row.call?.unusual_spread ? "text-amber-400" : ""}>{pct(row.call?.iv, 1)}</td>
                  <td>{num(row.call?.delta)}</td>
                  <td>{num(row.call?.gamma, 4)}</td>
                  <td>{num(row.call?.vega, 1)}</td>
                  <td>{num(row.call?.theta, 2)}</td>
                  <td>{num(row.call?.bid)}</td>
                  <td>{num(row.call?.ask)}</td>
                  <td className="text-center mono font-semibold text-zinc-100">
                    {row.strike}
                    {row.is_atm && <span className="ml-1"><Badge tone="info">ATM</Badge></span>}
                  </td>
                  <td>{num(row.put?.bid)}</td>
                  <td>{num(row.put?.ask)}</td>
                  <td>{num(row.put?.theta, 2)}</td>
                  <td>{num(row.put?.vega, 1)}</td>
                  <td>{num(row.put?.gamma, 4)}</td>
                  <td>{num(row.put?.delta)}</td>
                  <td className={row.put?.unusual_spread ? "text-amber-400" : ""}>{pct(row.put?.iv, 1)}</td>
                  <td>{intFmt(row.put?.volume)}</td>
                  <td>{intFmt(row.put?.open_interest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
