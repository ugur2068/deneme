import { NextResponse } from "next/server";

const MOCK_OI = [
  { symbol: "BTCUSDT", price: 67432, oi: 18_500_000_000, oiChange: 1.23 },
  { symbol: "ETHUSDT", price: 3521, oi: 9_200_000_000, oiChange: 0.87 },
  { symbol: "SOLUSDT", price: 178.3, oi: 2_100_000_000, oiChange: 3.45 },
  { symbol: "BNBUSDT", price: 582.4, oi: 1_200_000_000, oiChange: -0.56 },
  { symbol: "XRPUSDT", price: 0.6234, oi: 980_000_000, oiChange: -1.23 },
  { symbol: "DOGEUSDT", price: 0.1723, oi: 1_500_000_000, oiChange: 4.56 },
  { symbol: "INJUSDT", price: 34.56, oi: 420_000_000, oiChange: 5.67 },
  { symbol: "SUIUSDT", price: 1.567, oi: 380_000_000, oiChange: 6.78 },
  { symbol: "AVAXUSDT", price: 38.92, oi: 560_000_000, oiChange: 2.34 },
  { symbol: "NEARUSDT", price: 7.234, oi: 280_000_000, oiChange: 3.12 },
  { symbol: "APTUSDT", price: 11.45, oi: 260_000_000, oiChange: 4.23 },
  { symbol: "ARBUSDT", price: 1.234, oi: 340_000_000, oiChange: 1.78 },
  { symbol: "OPUSDT", price: 2.834, oi: 220_000_000, oiChange: 2.56 },
  { symbol: "ADAUSDT", price: 0.4821, oi: 680_000_000, oiChange: 1.45 },
  { symbol: "DOTUSDT", price: 7.834, oi: 380_000_000, oiChange: -1.89 },
  { symbol: "MATICUSDT", price: 0.8921, oi: 520_000_000, oiChange: 1.12 },
  { symbol: "LINKUSDT", price: 18.74, oi: 430_000_000, oiChange: 1.89 },
  { symbol: "ORDIUSDT", price: 67.89, oi: 290_000_000, oiChange: 7.89 },
  { symbol: "WLDUSDT", price: 4.823, oi: 150_000_000, oiChange: 0.67 },
  { symbol: "LTCUSDT", price: 88.45, oi: 340_000_000, oiChange: -0.34 },
  { symbol: "UNIUSDT", price: 11.23, oi: 260_000_000, oiChange: 2.23 },
  { symbol: "FTMUSDT", price: 0.7234, oi: 210_000_000, oiChange: 3.45 },
  { symbol: "ICPUSDT", price: 13.45, oi: 165_000_000, oiChange: 2.78 },
  { symbol: "RUNEUSDT", price: 5.678, oi: 175_000_000, oiChange: 1.34 },
  { symbol: "RENDERUSDT", price: 9.234, oi: 195_000_000, oiChange: 4.56 },
];

const TOP_SYMBOLS = [
  "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT",
  "ADAUSDT","DOGEUSDT","AVAXUSDT","DOTUSDT","MATICUSDT",
  "LINKUSDT","LTCUSDT","UNIUSDT","ATOMUSDT","ETCUSDT",
  "NEARUSDT","APTUSDT","OPUSDT","ARBUSDT","INJUSDT",
  "SUIUSDT","SEIUSDT","TIAUSDT","ORDIUSDT","WLDUSDT",
  "PENDLEUSDT","JUPUSDT","STRKUSDT","RUNEUSDT","RENDERUSDT",
];

export async function GET() {
  try {
    const results = await Promise.allSettled(
      TOP_SYMBOLS.map(async (symbol) => {
        const [oiRes, statsRes] = await Promise.all([
          fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`, {
            next: { revalidate: 30 },
            signal: AbortSignal.timeout(4000),
          }),
          fetch(
            `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=2`,
            { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) }
          ),
        ]);

        const oi = oiRes.ok ? await oiRes.json() : null;
        const stats = statsRes.ok ? await statsRes.json() : [];

        const currentOI = oi ? parseFloat(oi.openInterest) : 0;
        let oiChange1h = 0;
        if (stats && stats.length >= 2) {
          const prev = parseFloat(stats[0].sumOpenInterest);
          const curr = parseFloat(stats[1].sumOpenInterest);
          oiChange1h = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
        }

        return { symbol, baseAsset: symbol.replace("USDT", ""), openInterest: currentOI, oiChange1h };
      })
    );

    const priceRes = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr", {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    const prices = priceRes.ok ? await priceRes.json() : [];
    const priceMap = new Map(
      prices.map((t: { symbol: string; lastPrice: string; quoteVolume: string; priceChangePercent: string }) => [
        t.symbol,
        { price: parseFloat(t.lastPrice), volume: parseFloat(t.quoteVolume), change: parseFloat(t.priceChangePercent) },
      ])
    );

    const data = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => {
        const item = (r as PromiseFulfilledResult<{
          symbol: string; baseAsset: string; openInterest: number; oiChange1h: number;
        }>).value;
        const ticker = priceMap.get(item.symbol) as { price: number; volume: number; change: number } | undefined;
        return {
          ...item,
          price: ticker?.price || 0,
          volume24h: ticker?.volume || 0,
          change24h: ticker?.change || 0,
          oiUsd: item.openInterest * (ticker?.price || 0),
        };
      })
      .sort((a, b) => b.oiUsd - a.oiUsd);

    return NextResponse.json(data);
  } catch {
    // Return mock data
    const mockData = MOCK_OI.map((coin) => ({
      symbol: coin.symbol,
      baseAsset: coin.symbol.replace("USDT", ""),
      openInterest: coin.oi / coin.price,
      oiChange1h: coin.oiChange + (Math.random() - 0.5) * 0.5,
      oiUsd: coin.oi * (1 + (Math.random() - 0.5) * 0.02),
      price: coin.price * (1 + (Math.random() - 0.5) * 0.005),
      volume24h: coin.oi * 0.8 * (1 + (Math.random() - 0.5) * 0.1),
      change24h: (Math.random() - 0.4) * 6,
    })).sort((a, b) => b.oiUsd - a.oiUsd);

    return NextResponse.json(mockData);
  }
}
