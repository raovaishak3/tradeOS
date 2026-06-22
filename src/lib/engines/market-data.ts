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
      // Try new structure endpoint first
      const structRes = await fetch(`${this.baseUrl}/structure/${symbol}?period=1d`, {
        next: { revalidate: 60 }
      });
      const structData = await structRes.json();
      
      if (structData.structure) {
        // Return structure data as MarketScan-compatible format
        const s = structData.structure;
        return {
          close: s.price || 0,
          open: s.price || 0,
          high: s.liquidity?.bsl || s.price || 0,
          low: s.liquidity?.ssl || s.price || 0,
          change: 0,
          change_abs: 0,
          "Recommend.All": 0,
          "Recommend.MA": 0,
          RSI: 50,
          ADX: s.trend === "bullish" || s.trend === "bearish" ? 30 : 15,
          ATR: s.atr || 0,
          "MACD.macd": 0,
          "MACD.signal": 0,
          SMA20: s.price || 0,
          SMA50: s.price || 0,
          SMA200: s.price || 0,
          EMA20: s.price || 0,
          EMA50: s.price || 0,
          EMA200: s.price || 0,
          "Volatility.D": 0,
          "Perf.W": 0,
          "Perf.1M": 0,
          "High.1M": s.liquidity?.bsl || s.price || 0,
          "Low.1M": s.liquidity?.ssl || s.price || 0,
          // Extra structure fields
          _structure: s,
        } as any;
      }
      
      // Fallback to old scan endpoint
      const res = await fetch(`${this.baseUrl}/scan/${symbol}`, {
        next: { revalidate: 60 }
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
    // Check if we have real structure data
    const s = (scan as any)._structure;
    
    if (s) {
      // We have real candle-based structure detection
      const trend = s.trend || "neutral";
      const bos = s.bos ? `${s.bos.type} at ${s.bos.level}` : "None detected";
      const choch = s.choch ? `${s.choch.type} at ${s.choch.level}` : "None";
      const ob = s.order_block ? `${s.order_block.type} zone ${s.order_block.low}-${s.order_block.high}` : "None active";
      const fvg = s.fvg ? `${s.fvg.type} zone ${s.fvg.bottom}-${s.fvg.top}` : "None";
      const liq = s.liquidity || {};
      const zone = s.zone || "equilibrium";
      const displacement = s.displacement ? "YES — strong displacement detected" : "No displacement";
      const swings = s.swings || {};
      const recentHighs = (swings.highs || []).map((h: any) => h.price).join(", ");
      const recentLows = (swings.lows || []).map((l: any) => l.price).join(", ");

      return {
        Weekly: {
          bias: trend.includes("bull") ? "bullish" : trend.includes("bear") ? "bearish" : "neutral",
          structure: `Trend: ${trend}. BOS: ${bos}. CHOCH: ${choch}.`,
          liquidity: `BSL: ${liq.bsl || "unknown"}. SSL: ${liq.ssl || "unknown"}. Equal Highs: ${(liq.equal_highs || []).join(", ") || "none"}. Equal Lows: ${(liq.equal_lows || []).join(", ") || "none"}.`,
          key_levels: `Swing Highs: ${recentHighs}. Swing Lows: ${recentLows}. ATR: ${s.atr}`,
          notes: `Zone: ${zone}. Price position in range: ${s.price_position}`,
        },
        Daily: {
          bias: trend.includes("bull") ? "bullish" : trend.includes("bear") ? "bearish" : "neutral",
          structure: `${trend} structure. BOS: ${bos}. CHOCH: ${choch}. Displacement: ${displacement}.`,
          liquidity: `BSL at ${liq.bsl}. SSL at ${liq.ssl}. Price in ${zone}.`,
          key_levels: `Recent Swing Highs: ${recentHighs}. Swing Lows: ${recentLows}.`,
          notes: `Order Block: ${ob}. FVG: ${fvg}.`,
        },
        "4H": {
          bias: trend.includes("bull") ? "bullish" : trend.includes("bear") ? "bearish" : "neutral",
          structure: `Following daily ${trend} trend. BOS/CHOCH status from daily applies.`,
          liquidity: `ATR: ${s.atr}. Looking for sweep of ${trend.includes("bear") ? "BSL at " + liq.bsl : "SSL at " + liq.ssl}`,
          key_levels: `Key levels from daily structure`,
          notes: `Displacement: ${displacement}. OB: ${ob}.`,
        },
        "1H": {
          bias: "derived from higher timeframes",
          structure: `Monitoring for confirmation. Need CHOCH/BOS on this timeframe for entry.`,
          liquidity: `Internal liquidity around recent swings`,
          key_levels: `ATR: ${s.atr}`,
          notes: `Waiting for confirmation signal`,
        },
        "15M": {
          bias: "execution timeframe",
          structure: `Entry confirmation needed: CHOCH + displacement + retest of AOI`,
          liquidity: `Minor equal highs/lows for inducement`,
          key_levels: "",
          notes: `Only valid after 1H confirms`,
        },
      };
    }

    // Fallback: old indicator-based interpretation
    const price = scan.close;
    const sma50 = scan.SMA50;
    const sma200 = scan.SMA200;
    const atr = scan.ATR;
    const high1M = scan["High.1M"];
    const low1M = scan["Low.1M"];

    const aboveSMA200 = price > sma200;
    const aboveSMA50 = price > sma50;
    let weeklyBias = "neutral";
    if (aboveSMA200 && aboveSMA50) weeklyBias = "bullish";
    else if (!aboveSMA200 && !aboveSMA50) weeklyBias = "bearish";

    return {
      Weekly: { bias: weeklyBias, structure: "Indicator-based only", liquidity: `High: ${high1M}, Low: ${low1M}`, key_levels: `SMA50: ${sma50}, SMA200: ${sma200}`, notes: "Limited data — candle structure unavailable" },
      Daily: { bias: weeklyBias, structure: "See weekly", liquidity: "See weekly", key_levels: "", notes: "" },
      "4H": { bias: "neutral", structure: "No candle data", liquidity: "", key_levels: "", notes: "" },
      "1H": { bias: "neutral", structure: "No candle data", liquidity: "", key_levels: "", notes: "" },
      "15M": { bias: "neutral", structure: "No candle data", liquidity: "", key_levels: "", notes: "" },
    };
  }
}
