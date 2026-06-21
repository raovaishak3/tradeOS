/**
 * Market Data Service
 * 
 * Connects to the EC2 market data server to pull live
 * technical data for all watchlist instruments.
 */

export interface MarketScan {
  close: number;
  open: number;
  high: number;
  low: number;
  change: number;
  change_abs: number;
  "Recommend.All": number;
  "Recommend.MA": number;
  RSI: number;
  ADX: number;
  ATR: number;
  "MACD.macd": number;
  "MACD.signal": number;
  SMA20: number;
  SMA50: number;
  SMA200: number;
  EMA20: number;
  EMA50: number;
  EMA200: number;
  "Volatility.D": number;
  "Perf.W": number;
  "Perf.1M": number;
  "High.1M": number;
  "Low.1M": number;
  [key: string]: number;
}

export class MarketDataService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.MARKET_DATA_URL || "http://98.130.84.95:8080";
  }

  async scanSymbol(symbol: string): Promise<MarketScan | null> {
    try {
      const res = await fetch(`${this.baseUrl}/scan/${symbol}`, { 
        next: { revalidate: 60 } // Cache for 60 seconds
      });
      const data = await res.json();
      return data.scan || null;
    } catch {
      return null;
    }
  }

  async scanAll(): Promise<Record<string, MarketScan>> {
    try {
      const res = await fetch(`${this.baseUrl}/scan_all`, {
        next: { revalidate: 60 }
      });
      const data = await res.json();
      return data.symbols || {};
    } catch {
      return {};
    }
  }

  /**
   * Convert raw scan data into the format the Reasoning Engine expects.
   */
  interpretForReasoning(symbol: string, scan: MarketScan) {
    const price = scan.close;
    const sma50 = scan.SMA50;
    const sma200 = scan.SMA200;
    const rsi = scan.RSI;
    const adx = scan.ADX;
    const atr = scan.ATR;
    const recommend = scan["Recommend.All"];
    const perfW = scan["Perf.W"];
    const perfM = scan["Perf.1M"];
    const high1M = scan["High.1M"];
    const low1M = scan["Low.1M"];
    const macd = scan["MACD.macd"];
    const macdSignal = scan["MACD.signal"];
    const volatility = scan["Volatility.D"];

    // Determine bias from structure
    const aboveSMA200 = price > sma200;
    const aboveSMA50 = price > sma50;
    let weeklyBias = "neutral";
    if (aboveSMA200 && aboveSMA50) weeklyBias = "bullish";
    else if (!aboveSMA200 && !aboveSMA50) weeklyBias = "bearish";

    // Determine structure from price action
    let structure = "ranging";
    if (adx > 25 && aboveSMA50) structure = "bullish BOS likely, trending";
    else if (adx > 25 && !aboveSMA50) structure = "bearish BOS likely, trending";
    else if (adx < 20) structure = "ranging, compression possible";

    // Determine liquidity from monthly range
    const rangeSize = high1M - low1M;
    const priceInRange = (price - low1M) / rangeSize;
    let liquidity = "";
    if (priceInRange > 0.7) liquidity = `BSL above at ${high1M.toFixed(5)}, price in premium`;
    else if (priceInRange < 0.3) liquidity = `SSL below at ${low1M.toFixed(5)}, price in discount`;
    else liquidity = `Mid-range. BSL: ${high1M.toFixed(5)}, SSL: ${low1M.toFixed(5)}`;

    // Key levels
    const keyLevels = `SMA50: ${sma50.toFixed(5)}, SMA200: ${sma200.toFixed(5)}, 1M High: ${high1M.toFixed(5)}, 1M Low: ${low1M.toFixed(5)}`;

    // Notes
    const notes = `RSI: ${rsi.toFixed(1)}, ADX: ${adx.toFixed(1)}, ATR: ${atr.toFixed(5)}, MACD: ${macd > macdSignal ? "bullish" : "bearish"}, Week: ${perfW > 0 ? "+" : ""}${perfW.toFixed(2)}%, Month: ${perfM > 0 ? "+" : ""}${perfM.toFixed(2)}%`;

    return {
      Weekly: { bias: weeklyBias, structure, liquidity, key_levels: keyLevels, notes },
      Daily: { bias: weeklyBias, structure: `Price ${aboveSMA50 ? "above" : "below"} SMA50`, liquidity, key_levels: keyLevels, notes: `Volatility: ${(volatility * 100).toFixed(2)}%` },
      "4H": { bias: recommend > 0.1 ? "bullish" : recommend < -0.1 ? "bearish" : "neutral", structure: `ADX: ${adx.toFixed(1)} — ${adx > 25 ? "trending" : "ranging"}`, liquidity, key_levels: keyLevels, notes },
      "1H": { bias: "derived from 4H", structure: "See 4H analysis", liquidity: "Internal levels from ATR", key_levels: `ATR range: ${atr.toFixed(5)}`, notes: "" },
      "15M": { bias: "execution timeframe", structure: "Awaiting confirmation", liquidity: "Minor equal highs/lows", key_levels: "", notes: "" },
    };
  }
}
