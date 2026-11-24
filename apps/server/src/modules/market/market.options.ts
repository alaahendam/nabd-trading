/** Injection token for the market options, so the service does not read the environment itself. */
export const MARKET_OPTIONS = Symbol('MARKET_OPTIONS');

export interface MarketOptions {
  seed: string;
  volatilityScale: number;
  /** How often the simulator is stepped, in milliseconds. */
  stepMs: number;
}
