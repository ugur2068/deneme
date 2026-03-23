"use client";
import { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";

interface Ticker {
  symbol: string;
  baseAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return "$" + (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toFixed(2);
}

function formatPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toFixed(6);
}

export default function HomePage() {
  const [data, setData] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"volume24h" | "change24h" | "price">("volume24h");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/binance/tickers");
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let arr = data.filter(
      (t) =>
        t.baseAsset.toLowerCase().includes(search.toLowerCase()) ||
        t.symbol.toLowerCase().includes(search.toLowerCase())
    );
    arr = arr.sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return arr;
  }, [data, search, sortBy, sortDir]);

  function handleSort(col: "volume24h" | "change24h" | "price") {
    if (sortBy === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  const totalVolume = useMemo(() => data.reduce((s, t) => s + t.volume24h, 0), [data]);
  const gainers = useMemo(() => data.filter((t) => t.change24h > 0).length, [data]);
  const losers = useMemo(() => data.filter((t) => t.change24h < 0).length, [data]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#e6edf3" }}>
            Kripto Para Piyasası
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            USDT çiftleri · Gerçek zamanlı Binance verileri
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#8b949e" }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {lastUpdate && <span>Son: {lastUpdate.toLocaleTimeString("tr-TR")}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Toplam Hacim (24s)", value: formatNum(totalVolume) },
          { label: "Listelenen Coin", value: data.length.toString() },
          { label: "Yükselen", value: gainers.toString(), color: "#0ecb81" },
          { label: "Düşen", value: losers.toString(), color: "#f6465d" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg p-4 border"
            style={{ background: "#161b22", borderColor: "#30363d" }}
          >
            <div className="text-xs mb-1" style={{ color: "#8b949e" }}>
              {card.label}
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: card.color || "#e6edf3" }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 max-w-xs"
          style={{ background: "#161b22", borderColor: "#30363d" }}
        >
          <Search size={14} style={{ color: "#8b949e" }} />
          <input
            type="text"
            placeholder="Coin ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: "#e6edf3" }}
          />
        </div>
      </div>

      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: "#30363d" }}
      >
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>#</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Coin</th>
                <th
                  className="text-right px-4 py-3 font-medium cursor-pointer"
                  style={{ color: sortBy === "price" ? "#1e80ff" : "#8b949e" }}
                  onClick={() => handleSort("price")}
                >
                  Fiyat {sortBy === "price" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th
                  className="text-right px-4 py-3 font-medium cursor-pointer"
                  style={{ color: sortBy === "change24h" ? "#1e80ff" : "#8b949e" }}
                  onClick={() => handleSort("change24h")}
                >
                  24s Değişim {sortBy === "change24h" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th
                  className="text-right px-4 py-3 font-medium cursor-pointer"
                  style={{ color: sortBy === "volume24h" ? "#1e80ff" : "#8b949e" }}
                  onClick={() => handleSort("volume24h")}
                >
                  Hacim (24s) {sortBy === "volume24h" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: "#8b949e" }}>24s Yüksek</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: "#8b949e" }}>24s Düşük</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "#30363d" }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded animate-pulse" style={{ background: "#30363d" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((ticker, idx) => (
                    <tr
                      key={ticker.symbol}
                      className="border-t"
                      style={{ borderColor: "#30363d" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-4 py-3" style={{ color: "#8b949e" }}>{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "#21262d", color: "#8b949e" }}
                          >
                            {ticker.baseAsset.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: "#e6edf3" }}>{ticker.baseAsset}</div>
                            <div className="text-xs" style={{ color: "#8b949e" }}>USDT</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium" style={{ color: "#e6edf3" }}>
                        ${formatPrice(ticker.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="inline-flex items-center gap-0.5 font-medium"
                          style={{ color: ticker.change24h >= 0 ? "#0ecb81" : "#f6465d" }}
                        >
                          {ticker.change24h >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {ticker.change24h >= 0 ? "+" : ""}
                          {ticker.change24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: "#8b949e" }}>
                        {formatNum(ticker.volume24h)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell" style={{ color: "#0ecb81" }}>
                        ${formatPrice(ticker.high24h)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell" style={{ color: "#f6465d" }}>
                        ${formatPrice(ticker.low24h)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center" style={{ color: "#8b949e" }}>Sonuç bulunamadı.</div>
        )}
      </div>
    </div>
  );
}
