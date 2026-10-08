import { authHeaders } from "./auth";
import type {
  AlertEvent,
  AlertRule,
  BacktestRunDetail,
  BacktestSummary,
  ButterflyResponse,
  CalendarResponse,
  ExpiryInfo,
  HedgeSimulationResult,
  MonteCarloResult,
  Opportunity,
  OptionChainResponse,
  PortfolioRisk,
  Position,
  RealizedVolResponse,
  RiskReversalResponse,
  Settings,
  SkewResponse,
  StrategyAnalysis,
  StrategyTemplate,
  TermStructureResponse,
  Underlying,
  VolatilityResponse,
  WhatIfResult,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, `API ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

function get<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, { cache: "no-store", headers: { ...authHeaders() } }).then((r) => handle<T>(r, path));
}

function mutate<T>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((r) => handle<T>(r, path));
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
  const s = new URLSearchParams(entries).toString();
  return s ? `?${s}` : "";
}

export const api = {
  login: (username: string, password: string) =>
    mutate<{ access_token: string; token_type: string }>("/auth/login", "POST", { username, password }),
  me: () => get<{ username: string; is_active: boolean }>("/auth/me"),

  underlyings: () => get<Underlying[]>("/underlyings"),
  underlying: (symbol: string) => get<Underlying>(`/underlyings/${symbol}`),

  expiries: (symbol: string) => get<ExpiryInfo[]>(`/option-chain/${symbol}/expiries`),
  optionChain: (symbol: string, expiry: string) => get<OptionChainResponse>(`/option-chain/${symbol}?expiry=${expiry}`),

  volatility: (symbol: string) => get<VolatilityResponse>(`/volatility/${symbol}`),
  termStructure: (symbol: string) => get<TermStructureResponse>(`/term-structure/${symbol}`),
  skew: (symbol: string) => get<SkewResponse>(`/skew/${symbol}`),
  riskReversal: (symbol: string) => get<RiskReversalResponse>(`/risk-reversal/${symbol}`),
  butterfly: (symbol: string) => get<ButterflyResponse>(`/butterfly/${symbol}`),
  calendar: (symbol: string) => get<CalendarResponse>(`/calendar/${symbol}`),
  realizedVol: (symbol: string, estimator = "CLOSE_CLOSE") => get<RealizedVolResponse>(`/realized-vol/${symbol}?estimator=${estimator}`),

  opportunities: (params: Record<string, string | number | undefined> = {}) => get<Opportunity[]>(`/opportunities${qs(params)}`),
  opportunitiesForSymbol: (symbol: string, params: Record<string, string | number | undefined> = {}) =>
    get<Opportunity[]>(`/opportunities/${symbol}${qs(params)}`),
  refreshOpportunities: (symbol: string) => mutate<{ status: string }>(`/opportunities/${symbol}/refresh`, "POST"),

  settings: () => get<Settings>("/settings"),
  updateSettings: (patch: Record<string, unknown>) => mutate<Settings>("/settings", "PATCH", patch),

  strategyTemplates: () => get<StrategyTemplate[]>("/strategy/templates"),
  analyzeStrategy: (payload: unknown) => mutate<StrategyAnalysis>("/strategy/analyze", "POST", payload),

  regime: (symbol: string) => get<{ symbol: string; regime: string; rv20_percentile: number | null }>(`/regime/${symbol}`),

  runBacktest: (payload: unknown) => mutate<BacktestRunDetail>("/backtest", "POST", payload),
  listBacktests: (symbol?: string) => get<BacktestSummary[]>(`/backtest${symbol ? `?symbol=${symbol}` : ""}`),
  getBacktest: (runId: number) => get<BacktestRunDetail>(`/backtest/${runId}`),

  simulateHedge: (payload: unknown) => mutate<HedgeSimulationResult>("/simulation/hedge", "POST", payload),
  simulateMonteCarlo: (payload: unknown) => mutate<MonteCarloResult>("/simulation/monte-carlo", "POST", payload),

  listPositions: () => get<Position[]>("/portfolio/positions"),
  addPosition: (payload: unknown) => mutate<Position>("/portfolio/positions", "POST", payload),
  deletePosition: (id: number) => mutate<void>(`/portfolio/positions/${id}`, "DELETE"),
  portfolioRisk: () => get<PortfolioRisk>("/portfolio/risk"),
  whatIf: (payload: unknown) => mutate<WhatIfResult>("/portfolio/what-if", "POST", payload),

  listAlerts: (symbol?: string) => get<AlertRule[]>(`/alerts${symbol ? `?symbol=${symbol}` : ""}`),
  createAlert: (payload: unknown) => mutate<AlertRule>("/alerts", "POST", payload),
  deleteAlert: (id: number) => mutate<void>(`/alerts/${id}`, "DELETE"),
  alertEvents: () => get<AlertEvent[]>("/alerts/events"),
};

export { ApiError };
