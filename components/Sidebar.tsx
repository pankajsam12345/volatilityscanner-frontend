"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/scanner", label: "Opportunity Scanner" },
  { href: "/chain", label: "Option Chain" },
  { href: "/strategy-builder", label: "Strategy Builder" },
  { href: "/backtest", label: "Backtest" },
  { href: "/simulator", label: "Trade Simulator" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/alerts", label: "Alerts" },
  { href: "/term-structure", label: "Term Structure" },
  { href: "/skew", label: "Skew / RR / Butterfly" },
  { href: "/calendar", label: "Calendar" },
  { href: "/rv-analysis", label: "RV Analysis" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex w-52 shrink-0 flex-col gap-0.5 border-r border-zinc-800 bg-panel p-2">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded px-3 py-2 text-[13px] transition-colors ${
              active ? "bg-blue-600/20 text-blue-300" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto p-3 text-[10px] leading-snug text-zinc-600">
        Model-based estimates on synthetic DEMO DATA. Not a guarantee of profit. See Settings for assumptions.
      </div>
    </nav>
  );
}
