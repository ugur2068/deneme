"use client";
import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
}

export default function TickerBar() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/binance/tickers");
        if (!res.ok) return;
        const data = await res.json();
        // Take top 20 by volume
        setTickers(
          data.slice(0, 20).map((t: { baseAsset: string; price: number; change24h: number }) => ({
            symbol: t.baseAsset,
            price: t.price >= 10000
              ? t.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : t.price >= 1
              ? t.price.toFixed(4)
              : t.price.toFixed(6),
            change: t.change24h.toFixed(2),
          }))
        );
      } catch {
        // silently fail
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (tickers.length === 0) return null;

  const doubled = [...tickers, ...tickers];

  return (
    <div
      className="overflow-hidden border-b text-xs py-1.5"
      style={{ background: "#0d1117", borderColor: "#30363d" }}
    >
      <div className="flex ticker-animate whitespace-nowrap">
        {doubled.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 mx-4 shrink-0">
            <span className="font-semibold" style={{ color: "#e6edf3" }}>
              {t.symbol}
            </span>
            <span style={{ color: "#8b949e" }}>${t.price}</span>
            <span style={{ color: parseFloat(t.change) >= 0 ? "#0ecb81" : "#f6465d" }}>
              {parseFloat(t.change) >= 0 ? "+" : ""}
              {t.change}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
