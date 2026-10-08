"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SymbolCtx = createContext<{ symbol: string; setSymbol: (s: string) => void }>({
  symbol: "NIFTY",
  setSymbol: () => {},
});

export function SymbolProvider({ children }: { children: React.ReactNode }) {
  const [symbol, setSymbolState] = useState("NIFTY");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("vos.symbol") : null;
    if (stored) setSymbolState(stored);
  }, []);

  const setSymbol = (s: string) => {
    setSymbolState(s);
    if (typeof window !== "undefined") window.localStorage.setItem("vos.symbol", s);
  };

  return <SymbolCtx.Provider value={{ symbol, setSymbol }}>{children}</SymbolCtx.Provider>;
}

export function useSymbol() {
  return useContext(SymbolCtx);
}
