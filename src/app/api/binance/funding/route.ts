import { NextResponse } from "next/server";

const MOCK_FUNDING = [
  { symbol: "BTCUSDT", price: 67432, volume: 28_500_000_000, change: 2.34, fundingRate: 0.000100 },
  { symbol: "ETHUSDT", price: 3521, volume: 15_200_000_000, change: 1.89, fundingRate: 0.000085 },
  { symbol: "SOLUSDT", price: 178.3, volume: 3_200_000_000, change: 4.56, fundingRate: 0.000312 },
  { symbol: "BNBUSDT", price: 582.4, volume: 1_850_000_000, change: -0.72, fundingRate: -0.000045 },
  { symbol: "XRPUSDT", price: 0.6234, volume: 2_100_000_000, change: -1.23, fundingRate: -0.000123 },
  { symbol: "DOGEUSDT", price: 0.1723, volume: 2_400_000_000, change: 5.67, fundingRate: 0.000456 },
  { symbol: "INJUSDT", price: 34.56, volume: 450_000_000, change: 6.23, fundingRate: 0.000789 },
  { symbol: "SUIUSDT", price: 1.567, volume: 520_000_000, change: 7.89, fundingRate: 0.000654 },
  { symbol: "ORDIUSDT", price: 67.89, volume: 480_000_000, change: 8.92, fundingRate: 0.001023 },
  { symbol: "AVAXUSDT", price: 38.92, volume: 620_000_000, change: 3.45, fundingRate: 0.000234 },
  { symbol: "NEARUSDT", price: 7.234, volume: 310_000_000, change: 4.12, fundingRate: 0.000345 },
  { symbol: "APTUSDT", price: 11.45, volume: 280_000_000, change: 5.34, fundingRate: 0.000412 },
  { symbol: "ARBUSDT", price: 1.234, volume: 390_000_000, change: 2.45, fundingRate: 0.000178 },
  { symbol: "OPUSDT", price: 2.834, volume: 240_000_000, change: 3.78, fundingRate: 0.000289 },
  { symbol: "ADAUSDT", price: 0.4821, volume: 780_000_000, change: 2.11, fundingRate: 0.000156 },
  { symbol: "DOTUSDT", price: 7.834, volume: 420_000_000, change: -2.14, fundingRate: -0.000089 },
  { symbol: "MATICUSDT", price: 0.8921, volume: 580_000_000, change: 1.78, fundingRate: 0.000134 },
  { symbol: "LINKUSDT", price: 18.74, volume: 480_000_000, change: 2.90, fundingRate: 0.000223 },
  { symbol: "TIAUSDT", price: 12.34, volume: 220_000_000, change: -2.34, fundingRate: -0.000234 },
  { symbol: "WLDUSDT", price: 4.823, volume: 160_000_000, change: 1.23, fundingRate: 0.000089 },
  { symbol: "LTCUSDT", price: 88.45, volume: 380_000_000, change: -0.45, fundingRate: -0.000034 },
  { symbol: "UNIUSDT", price: 11.23, volume: 290_000_000, change: 3.21, fundingRate: 0.000245 },
  { symbol: "ATOMUSDT", price: 9.876, volume: 210_000_000, change: -1.56, fundingRate: -0.000067 },
  { symbol: "FTMUSDT", price: 0.7234, volume: 240_000_000, change: 4.23, fundingRate: 0.000345 },
  { symbol: "GALAUSDT", price: 0.04234, volume: 140_000_000, change: 2.78, fundingRate: 0.000189 },
];

export async function GET() {
  try {
    const res = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex", {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Binance Futures API error");
    const data = await res.json();

    const tickerRes = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr", {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    });
    const tickers = tickerRes.ok ? await tickerRes.json() : [];

    const tickerMap = new Map(
      tickers.map((t: { symbol: string; lastPrice: string; quoteVolume: string; priceChangePercent: string }) => [
        t.symbol,
        { price: parseFloat(t.lastPrice), volume: parseFloat(t.quoteVolume), change: parseFloat(t.priceChangePercent) },
      ])
    );

    const filtered = data
      .filter((t: { symbol: string }) => t.symbol.endsWith("USDT"))
      .map((t: { symbol: string; lastFundingRate: string; nextFundingTime: number; indexPrice: string; markPrice: string }) => {
        const ticker = tickerMap.get(t.symbol) as { price: number; volume: number; change: number } | undefined;
        return {
          symbol: t.symbol,
          baseAsset: t.symbol.replace("USDT", ""),
          fundingRate: parseFloat(t.lastFundingRate),
          fundingRatePct: (parseFloat(t.lastFundingRate) * 100).toFixed(4),
          nextFundingTime: t.nextFundingTime,
          indexPrice: parseFloat(t.indexPrice),
          markPrice: parseFloat(t.markPrice),
          price: ticker?.price || 0,
          volume24h: ticker?.volume || 0,
          change24h: ticker?.change || 0,
        };
      })
      .sort((a: { volume24h: number }, b: { volume24h: number }) => b.volume24h - a.volume24h);

    return NextResponse.json(filtered);
  } catch {
    // Return mock data
    const now = Date.now();
    const nextFunding = now + (8 * 3600000 - (now % (8 * 3600000)));
    const mockData = MOCK_FUNDING.map((coin) => ({
      symbol: coin.symbol,
      baseAsset: coin.symbol.replace("USDT", ""),
      fundingRate: coin.fundingRate + (Math.random() - 0.5) * 0.0001,
      fundingRatePct: (coin.fundingRate * 100).toFixed(4),
      nextFundingTime: nextFunding,
      indexPrice: coin.price * (1 + (Math.random() - 0.5) * 0.001),
      markPrice: coin.price * (1 + (Math.random() - 0.5) * 0.001),
      price: coin.price * (1 + (Math.random() - 0.5) * 0.005),
      volume24h: coin.volume * (1 + (Math.random() - 0.5) * 0.05),
      change24h: coin.change + (Math.random() - 0.5) * 0.1,
    })).sort((a, b) => b.volume24h - a.volume24h);

    return NextResponse.json(mockData);
  }
}
