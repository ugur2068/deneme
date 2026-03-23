import { NextResponse } from "next/server";

const MOCK_GROUPED = [
  { symbol: "BTCUSDT", buyUsd: 12_500_000, sellUsd: 18_200_000 },
  { symbol: "ETHUSDT", buyUsd: 6_800_000, sellUsd: 9_400_000 },
  { symbol: "SOLUSDT", buyUsd: 2_300_000, sellUsd: 3_100_000 },
  { symbol: "DOGEUSDT", buyUsd: 1_900_000, sellUsd: 2_800_000 },
  { symbol: "BNBUSDT", buyUsd: 1_200_000, sellUsd: 1_700_000 },
  { symbol: "XRPUSDT", buyUsd: 980_000, sellUsd: 1_340_000 },
  { symbol: "INJUSDT", buyUsd: 750_000, sellUsd: 980_000 },
  { symbol: "SUIUSDT", buyUsd: 620_000, sellUsd: 890_000 },
  { symbol: "AVAXUSDT", buyUsd: 540_000, sellUsd: 720_000 },
  { symbol: "ORDIUSDT", buyUsd: 480_000, sellUsd: 670_000 },
  { symbol: "NEARUSDT", buyUsd: 320_000, sellUsd: 450_000 },
  { symbol: "APTUSDT", buyUsd: 290_000, sellUsd: 410_000 },
  { symbol: "ARBUSDT", buyUsd: 340_000, sellUsd: 480_000 },
  { symbol: "ADAUSDT", buyUsd: 280_000, sellUsd: 390_000 },
  { symbol: "LTCUSDT", buyUsd: 210_000, sellUsd: 295_000 },
];

const MOCK_PRICES: Record<string, number> = {
  BTCUSDT: 67432, ETHUSDT: 3521, SOLUSDT: 178.3, DOGEUSDT: 0.1723,
  BNBUSDT: 582.4, XRPUSDT: 0.6234, INJUSDT: 34.56, SUIUSDT: 1.567,
  AVAXUSDT: 38.92, ORDIUSDT: 67.89, NEARUSDT: 7.234, APTUSDT: 11.45,
  ARBUSDT: 1.234, ADAUSDT: 0.4821, LTCUSDT: 88.45,
};

function generateRecentLiquidations() {
  const items = [];
  const symbols = Object.keys(MOCK_PRICES);
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const price = MOCK_PRICES[symbol];
    const side = Math.random() > 0.45 ? "SELL" : "BUY";
    const qty = (Math.random() * 2 + 0.01) / (price > 1000 ? 100 : price > 100 ? 10 : 1);
    const liqPrice = price * (1 + (Math.random() - 0.5) * 0.02);
    items.push({
      symbol,
      baseAsset: symbol.replace("USDT", ""),
      side,
      qty: parseFloat(qty.toFixed(4)),
      price: parseFloat(liqPrice.toFixed(4)),
      usd: qty * liqPrice,
      time: now - Math.floor(Math.random() * 3600000),
    });
  }

  return items.sort((a, b) => b.time - a.time);
}

export async function GET() {
  try {
    const res = await fetch(
      "https://fapi.binance.com/fapi/v1/allForceOrders?limit=200",
      { next: { revalidate: 15 }, signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) throw new Error("Failed to fetch liquidations");
    const data = await res.json();

    const grouped: Record<string, { symbol: string; buyCount: number; sellCount: number; buyUsd: number; sellUsd: number; total: number }> = {};

    for (const order of data) {
      if (!order.symbol.endsWith("USDT")) continue;
      if (!grouped[order.symbol]) {
        grouped[order.symbol] = { symbol: order.symbol, buyCount: 0, sellCount: 0, buyUsd: 0, sellUsd: 0, total: 0 };
      }
      const usd = parseFloat(order.origQty) * parseFloat(order.price);
      if (order.side === "BUY") {
        grouped[order.symbol].buyCount++;
        grouped[order.symbol].buyUsd += usd;
      } else {
        grouped[order.symbol].sellCount++;
        grouped[order.symbol].sellUsd += usd;
      }
      grouped[order.symbol].total += usd;
    }

    const priceRes = await fetch("https://fapi.binance.com/fapi/v1/ticker/price", {
      next: { revalidate: 30 }, signal: AbortSignal.timeout(4000),
    });
    const prices = priceRes.ok ? await priceRes.json() : [];
    const priceMap = new Map(
      prices.map((t: { symbol: string; price: string }) => [t.symbol, parseFloat(t.price)])
    );

    const result = Object.values(grouped)
      .map((item) => ({
        ...item,
        baseAsset: item.symbol.replace("USDT", ""),
        price: priceMap.get(item.symbol) || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 50);

    const recent = data
      .filter((o: { symbol: string }) => o.symbol.endsWith("USDT"))
      .slice(0, 50)
      .map((o: { symbol: string; side: string; origQty: string; price: string; time: number }) => ({
        symbol: o.symbol,
        baseAsset: o.symbol.replace("USDT", ""),
        side: o.side,
        qty: parseFloat(o.origQty),
        price: parseFloat(o.price),
        usd: parseFloat(o.origQty) * parseFloat(o.price),
        time: o.time,
      }));

    return NextResponse.json({ grouped: result, recent });
  } catch {
    // Return mock data
    const grouped = MOCK_GROUPED.map((item) => ({
      ...item,
      baseAsset: item.symbol.replace("USDT", ""),
      buyCount: Math.floor(Math.random() * 20) + 1,
      sellCount: Math.floor(Math.random() * 30) + 1,
      total: item.buyUsd + item.sellUsd,
      price: MOCK_PRICES[item.symbol] || 0,
    })).sort((a, b) => b.total - a.total);

    const recent = generateRecentLiquidations();

    return NextResponse.json({ grouped, recent });
  }
}
