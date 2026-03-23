import { NextResponse } from "next/server";

const MOCK_LS = [
  { symbol: "BTCUSDT", price: 67432, change: 2.34, globalLong: 52.4, topAccLong: 54.2, topPosLong: 55.8 },
  { symbol: "ETHUSDT", price: 3521, change: 1.89, globalLong: 50.8, topAccLong: 51.3, topPosLong: 52.1 },
  { symbol: "SOLUSDT", price: 178.3, change: 4.56, globalLong: 56.7, topAccLong: 58.2, topPosLong: 60.1 },
  { symbol: "BNBUSDT", price: 582.4, change: -0.72, globalLong: 48.3, topAccLong: 47.6, topPosLong: 46.9 },
  { symbol: "XRPUSDT", price: 0.6234, change: -1.23, globalLong: 46.7, topAccLong: 45.2, topPosLong: 44.8 },
  { symbol: "DOGEUSDT", price: 0.1723, change: 5.67, globalLong: 58.9, topAccLong: 61.3, topPosLong: 63.4 },
  { symbol: "AVAXUSDT", price: 38.92, change: 3.45, globalLong: 54.3, topAccLong: 55.6, topPosLong: 57.2 },
  { symbol: "ADAUSDT", price: 0.4821, change: 2.11, globalLong: 51.2, topAccLong: 52.4, topPosLong: 53.8 },
  { symbol: "DOTUSDT", price: 7.834, change: -2.14, globalLong: 47.8, topAccLong: 46.3, topPosLong: 45.1 },
  { symbol: "MATICUSDT", price: 0.8921, change: 1.78, globalLong: 53.1, topAccLong: 54.0, topPosLong: 55.3 },
  { symbol: "LINKUSDT", price: 18.74, change: 2.90, globalLong: 55.6, topAccLong: 56.9, topPosLong: 58.4 },
  { symbol: "INJUSDT", price: 34.56, change: 6.23, globalLong: 62.3, topAccLong: 65.1, topPosLong: 67.8 },
  { symbol: "SUIUSDT", price: 1.567, change: 7.89, globalLong: 64.5, topAccLong: 67.2, topPosLong: 70.1 },
  { symbol: "APTUSDT", price: 11.45, change: 5.34, globalLong: 59.4, topAccLong: 61.8, topPosLong: 64.2 },
  { symbol: "ARBUSDT", price: 1.234, change: 2.45, globalLong: 52.8, topAccLong: 54.3, topPosLong: 56.1 },
  { symbol: "NEARUSDT", price: 7.234, change: 4.12, globalLong: 57.2, topAccLong: 59.4, topPosLong: 61.8 },
  { symbol: "OPUSDT", price: 2.834, change: 3.78, globalLong: 55.1, topAccLong: 57.3, topPosLong: 59.6 },
  { symbol: "LTCUSDT", price: 88.45, change: -0.45, globalLong: 49.6, topAccLong: 48.7, topPosLong: 47.8 },
  { symbol: "UNIUSDT", price: 11.23, change: 3.21, globalLong: 56.8, topAccLong: 58.5, topPosLong: 60.3 },
  { symbol: "ORDIUSDT", price: 67.89, change: 8.92, globalLong: 67.4, topAccLong: 70.2, topPosLong: 73.5 },
];

const TOP_SYMBOLS = MOCK_LS.map(m => m.symbol);

export async function GET() {
  try {
    const results = await Promise.allSettled(
      TOP_SYMBOLS.map(async (symbol) => {
        const [globalRes, topAccRes, topPosRes] = await Promise.all([
          fetch(
            `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`,
            { next: { revalidate: 30 }, signal: AbortSignal.timeout(4000) }
          ),
          fetch(
            `https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`,
            { next: { revalidate: 30 }, signal: AbortSignal.timeout(4000) }
          ),
          fetch(
            `https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=5m&limit=1`,
            { next: { revalidate: 30 }, signal: AbortSignal.timeout(4000) }
          ),
        ]);

        const global = globalRes.ok ? await globalRes.json() : [];
        const topAcc = topAccRes.ok ? await topAccRes.json() : [];
        const topPos = topPosRes.ok ? await topPosRes.json() : [];

        return {
          symbol,
          baseAsset: symbol.replace("USDT", ""),
          globalLong: global[0] ? parseFloat(global[0].longAccount) * 100 : 50,
          globalShort: global[0] ? parseFloat(global[0].shortAccount) * 100 : 50,
          globalRatio: global[0] ? parseFloat(global[0].longShortRatio) : 1,
          topAccLong: topAcc[0] ? parseFloat(topAcc[0].longAccount) * 100 : 50,
          topAccShort: topAcc[0] ? parseFloat(topAcc[0].shortAccount) * 100 : 50,
          topPosLong: topPos[0] ? parseFloat(topPos[0].longAccount) * 100 : 50,
          topPosShort: topPos[0] ? parseFloat(topPos[0].shortAccount) * 100 : 50,
        };
      })
    );

    const priceRes = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr", {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    const prices = priceRes.ok ? await priceRes.json() : [];
    const priceMap = new Map(
      prices.map((t: { symbol: string; lastPrice: string; priceChangePercent: string }) => [
        t.symbol,
        { price: parseFloat(t.lastPrice), change: parseFloat(t.priceChangePercent) },
      ])
    );

    const data = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => {
        const item = (r as PromiseFulfilledResult<{
          symbol: string; baseAsset: string;
          globalLong: number; globalShort: number; globalRatio: number;
          topAccLong: number; topAccShort: number; topPosLong: number; topPosShort: number;
        }>).value;
        const ticker = priceMap.get(item.symbol) as { price: number; change: number } | undefined;
        return { ...item, price: ticker?.price || 0, change24h: ticker?.change || 0 };
      });

    return NextResponse.json(data);
  } catch {
    // Return mock data
    const mockData = MOCK_LS.map((coin) => {
      const noise = (Math.random() - 0.5) * 2;
      return {
        symbol: coin.symbol,
        baseAsset: coin.symbol.replace("USDT", ""),
        globalLong: coin.globalLong + noise,
        globalShort: 100 - coin.globalLong - noise,
        globalRatio: coin.globalLong / (100 - coin.globalLong),
        topAccLong: coin.topAccLong + noise,
        topAccShort: 100 - coin.topAccLong - noise,
        topPosLong: coin.topPosLong + noise,
        topPosShort: 100 - coin.topPosLong - noise,
        price: coin.price * (1 + (Math.random() - 0.5) * 0.005),
        change24h: coin.change + (Math.random() - 0.5) * 0.2,
      };
    });
    return NextResponse.json(mockData);
  }
}
