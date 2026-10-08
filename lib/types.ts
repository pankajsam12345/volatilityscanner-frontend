export type Underlying = {
  symbol: string;
  exchange: string;
  spot_price: number;
  lot_size: number;
  timestamp: string;
  is_demo: boolean;
  atm_iv_1m: number | null;
  rv20: number | null;
  iv_rv_spread: number | null;
  regime: string;
};

export type ExpiryInfo = {
  expiry_date: string;
  days_to_expiry: number;
  business_days_to_expiry: number;
};

export type ChainLeg = {
  bid: number;
  ask: number;
  ltp: number;
  volume: number;
  open_interest: number;
  iv: number | null;
  iv_status: string;
  delta: number | null;
  gamma: number | null;
  vega: number | null;
  theta: number | null;
  unusual_spread: boolean;
} | null;

export type ChainRow = {
  strike: number;
  is_atm: boolean;
  call: ChainLeg;
  put: ChainLeg;
};

export type OptionChainResponse = {
  symbol: string;
  spot_price: number;
  expiry_date: string;
  timestamp: string;
  atm_iv: number | null;
  rows: ChainRow[];
};

export type HistoryContext = {
  current: number | null;
  mean: number | null;
  median: number | null;
  std: number | null;
  percentile: number | null;
  zscore: number | null;
  sample_size: number;
};

export type TermStructurePoint = {
  expiry_date: string;
  tenor_label: string;
  days_to_expiry: number;
  atm_iv: number | null;
  atm_iv_history: HistoryContext;
  forward_vol_from_prev: { value: number | null; valid: boolean; error: string | null } | null;
};

export type TermStructureResponse = {
  symbol: string;
  regime: "CONTANGO" | "BACKWARDATION" | "MIXED" | null;
  slope: number | null;
  curvature: number | null;
  local_inversions_at_tenor_years: number[];
  curve: TermStructurePoint[];
};

export type SkewBucket = {
  delta: number;
  put_iv: number | null;
  call_iv: number | null;
  put_wing: number | null;
  call_wing: number | null;
  put_call_skew: number | null;
  put_wing_history: HistoryContext;
};

export type SkewExpiry = {
  expiry_date: string;
  tenor_label: string;
  atm_iv: number | null;
  buckets: SkewBucket[];
};

export type SkewResponse = { symbol: string; expiries: SkewExpiry[] };

export type RRBucket = { delta: number; rr: number | null; history: HistoryContext };
export type RiskReversalResponse = { symbol: string; expiries: { expiry_date: string; tenor_label: string; buckets: RRBucket[] }[] };

export type BFBucket = { delta: number; bf: number | null; history: HistoryContext; convexity_flag: { passed: boolean; detail: string } };
export type ButterflyResponse = { symbol: string; expiries: { expiry_date: string; tenor_label: string; atm_iv: number | null; buckets: BFBucket[] }[] };

export type CalendarCell = {
  near_label: string;
  far_label: string;
  near_iv: number | null;
  far_iv: number | null;
  calendar_spread: number;
  forward_vol: number | null;
  forward_vol_valid: boolean;
  calendar_spread_vol_pts_zscore: number | null;
  calendar_spread_vol_pts_percentile: number | null;
  signal: string;
  forward_vol_history_sample_size: number;
  no_arbitrage_flag: { passed: boolean; detail: string };
};

export type CalendarResponse = { symbol: string; cells: CalendarCell[] };

export type VolatilityExpiry = {
  expiry_date: string;
  tenor_label: string;
  days_to_expiry: number;
  atm_iv: number | null;
  atm_iv_history: HistoryContext;
  iv_rv_20_spread: number | null;
  iv_rv_20_ratio: number | null;
};

export type VolatilityResponse = {
  symbol: string;
  spot_price: number;
  realized_vol: Record<string, number | null>;
  expiries: VolatilityExpiry[];
};

export type RealizedVolResponse = {
  symbol: string;
  estimator: string;
  latest: Record<string, number | null>;
  series: Record<string, { timestamp: string; value: number }[]>;
};

export type OpportunityLegView = {
  description: string;
  action: string;
  tenor: string;
  delta_bucket: string;
  option_type: string | null;
  iv: number | null;
  liquidity: string;
  spread_pct: number | null;
};

export type Opportunity = {
  id: number;
  symbol: string;
  timestamp: string;
  expiry_id: number | null;
  strategy: string;
  signal_type: string;
  direction: string;
  score: number;
  score_components: Record<string, number | Record<string, number>>;
  confidence: number;
  gross_edge: number;
  transaction_cost: number;
  net_edge: number;
  max_risk: number;
  expected_return: number;
  risk_reward: number;
  liquidity_status: string;
  data_quality: string;
  legs: OpportunityLegView[];
  greeks: Record<string, number>;
  historical_context: Record<string, unknown>;
  no_arbitrage_flags: { check: string; passed: boolean; detail: string }[];
  explanation: { why: string[]; risks: string[] };
  is_demo: boolean;
};

export type Settings = Record<string, unknown>;

// --- Phase 4-5 -------------------------------------------------------------

export type StrategyLegInput = {
  option_type: "CALL" | "PUT";
  delta_target: number; // signed: + for call-side, - for put-side; 0.5/-0.5 = ATM
  action: "BUY" | "SELL";
  quantity: number;
};

export type StrategyTemplate = {
  key: string;
  label: string;
  description: string;
  legs: StrategyLegInput[];
};

export type ResolvedLeg = {
  option_type: string;
  action: string;
  quantity: number;
  strike: number;
  iv: number | null;
  bid: number;
  ask: number;
  greeks: Record<string, number>;
};

export type StrategyAnalysis = {
  symbol: string;
  expiry_date: string;
  legs: ResolvedLeg[];
  net_premium: number;
  greeks: Record<string, number>;
  transaction_cost_cash: number;
  payoff_curve: { spot: number; pnl: number }[];
  breakevens: number[];
  max_risk: number | null;
  max_reward: number | null;
  undefined_risk: boolean;
  undefined_reward: boolean;
};

export type BacktestTradeLeg = {
  option_type: string;
  action: string;
  quantity: number;
  strike: number;
  entry_price: number;
  exit_price: number;
};

export type BacktestTrade = {
  entry_date: string;
  exit_date: string;
  direction: string;
  entry_value: number;
  exit_value: number;
  entry_zscore: number;
  exit_zscore: number;
  holding_days: number;
  gross_pnl: number;
  transaction_cost: number;
  net_pnl: number;
  regime_at_entry: string;
  legs: BacktestTradeLeg[] | null; // populated only when replay_mode === "CHAIN"
};

export type BacktestSummaryStats = {
  num_trades: number;
  win_rate: number | null;
  avg_return: number | null;
  median_return: number | null;
  max_drawdown: number | null;
  sharpe: number | null;
  profit_factor: number | null;
  tail_loss_p5: number | null;
  total_pnl: number;
};

export type BacktestSummary = {
  id: number;
  symbol: string;
  signal_type: string;
  bucket: string;
  replay_mode: "SIGNAL" | "CHAIN";
  params: Record<string, unknown>;
  summary: BacktestSummaryStats;
  created_at: string;
};

export type BacktestRunDetail = BacktestSummary & {
  trades: BacktestTrade[];
  regime_breakdown: Record<string, BacktestSummaryStats>;
  equity_curve: { date: string; cumulative_pnl: number }[];
};

export type HedgeSimulationResult = {
  rehedge_frequency: string;
  num_days: number;
  cumulative: { day: number; spot_pnl: number; gamma_pnl: number; theta_pnl: number; vega_pnl: number; carry: number; transaction_cost: number; net_pnl: number }[];
  totals: Record<string, number>;
};

export type MonteCarloResult = {
  num_paths: number;
  horizon_days: number;
  pnl_distribution_sample: number[];
  mean_pnl: number;
  var_95: number;
  cvar_95: number;
  prob_profit: number;
  prob_loss: number;
};

export type Position = {
  id: number;
  underlying_id: number;
  symbol: string;
  label: string;
  legs: ResolvedLeg[];
  quantity: number;
  opened_at: string;
  is_open: boolean;
};

export type PortfolioRisk = {
  positions: Position[];
  aggregated_greeks: Record<string, number>;
  var_95: number;
  cvar_95: number;
};

export type WhatIfCell = { spot_shock_pct: number; vol_shock_pts: number; time_shock_days: number; pnl: number };
export type WhatIfResult = { cells: WhatIfCell[]; base_greeks: Record<string, number> };

export type AlertRule = {
  id: number;
  symbol: string;
  metric: string;
  bucket: string;
  condition: string;
  threshold: number;
  channel: string;
  webhook_url: string | null;
  recipient: string | null;
  is_active: boolean;
  currently_met: boolean;
  last_triggered_at: string | null;
};

export type AlertEvent = {
  id: number;
  alert_id: number;
  triggered_at: string;
  observed_value: number;
  message: string;
};
