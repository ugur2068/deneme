// Binance public API helper functions
const BINANCE_REST = "https://api.binance.com";
const BINANCE_FUTURES = "https://fapi.binance.com";

export async function getBinanceTickers() {
  const res = await fetch(`${BINANCE_REST}/api/v3/ticker/24hr`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error("Failed to fetch tickers");
  return res.json();
}

export async function getFuturesTickers() {
  const res = await fetch(`${BINANCE_FUTURES}/fapi/v1/ticker/24hr`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error("Failed to fetch futures tickers");
  return res.json();
}

export async function getFundingRates() {
  const res = await fetch(`${BINANCE_FUTURES}/fapi/v1/premiumIndex`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch funding rates");
  return res.json();
}

export async function getOpenInterest(symbol: string) {
  const res = await fetch(
    `${BINANCE_FUTURES}/fapi/v1/openInterest?symbol=${symbol}`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error("Failed to fetch open interest");
  return res.json();
}

export async function getOpenInterestStats(symbol: string, period: string = "5m") {
  const res = await fetch(
    `${BINANCE_FUTURES}/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=30`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error("Failed to fetch open interest stats");
  return res.json();
}

export async function getLongShortRatio(symbol: string, period: string = "5m") {
  const res = await fetch(
    `${BINANCE_FUTURES}/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error("Failed to fetch long/short ratio");
  return res.json();
}

export async function getTopLongShortPositions(symbol: string, period: string = "5m") {
  const res = await fetch(
    `${BINANCE_FUTURES}/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=${period}&limit=1`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error("Failed to fetch top long/short positions");
  return res.json();
}

export async function getTopTraderLongShort(symbol: string, period: string = "5m") {
  const res = await fetch(
    `${BINANCE_FUTURES}/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`,
    { next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error("Failed to fetch top trader long/short");
  return res.json();
}

export function formatNumber(n: number, decimals: number = 2): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
  return n.toFixed(decimals);
}

export function formatPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toFixed(6);
}
