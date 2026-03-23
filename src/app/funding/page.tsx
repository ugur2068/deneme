"use client";
import { useEffect, useState, useMemo } from "react";
import { Search, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface FundingItem {
  symbol: string;
  baseAsset: string;
  fundingRate: number;
  fundingRatePct: string;
  nextFundingTime: number;
  indexPrice: number;
  markPrice: number;
  price: number;
  volume24h: number;
  change24h: number;
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

function formatCountdown(ms: number): string {
  const diff = ms - Date.now();
  if (diff <= 0) return "Yakında";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function FundingPage() {
  const [data, setData] = useState<FundingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "positive" | "negative">("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/binance/funding");
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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return data
      .filter((t) => {
        const matchSearch =
          t.baseAsset.toLowerCase().includes(search.toLowerCase()) ||
          t.symbol.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
          filter === "all" ||
          (filter === "positive" && t.fundingRate >= 0) ||
          (filter === "negative" && t.fundingRate < 0);
        return matchSearch && matchFilter;
      })
      .sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));
  }, [data, search, filter]);

  const avgRate = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((s, t) => s + t.fundingRate, 0) / data.length;
  }, [data]);

  const positive = useMemo(() => data.filter((t) => t.fundingRate > 0).length, [data]);
  const negative = useMemo(() => data.filter((t) => t.fundingRate < 0).length, [data]);
  const highest = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((max, t) => (t.fundingRate > max.fundingRate ? t : max), data[0]);
  }, [data]);
  const lowest = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((min, t) => (t.fundingRate < min.fundingRate ? t : min), data[0]);
  }, [data]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#e6edf3" }}>Fonlama Oranları</h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            Binance Futures · Gerçek zamanlı fonlama oranları
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#8b949e" }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {lastUpdate && <span>Son: {lastUpdate.toLocaleTimeString("tr-TR")}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>Ort. Fonlama Oranı</div>
          <div className="text-xl font-bold" style={{ color: avgRate >= 0 ? "#0ecb81" : "#f6465d" }}>
            {(avgRate * 100).toFixed(4)}%
          </div>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>Pozitif Oran</div>
          <div className="text-xl font-bold" style={{ color: "#0ecb81" }}>{positive}</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>Negatif Oran</div>
          <div className="text-xl font-bold" style={{ color: "#f6465d" }}>{negative}</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>En Yüksek</div>
          {highest && (
            <div className="text-xl font-bold" style={{ color: "#0ecb81" }}>
              {highest.baseAsset} {(highest.fundingRate * 100).toFixed(4)}%
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ background: "#161b22", borderColor: "#30363d" }}
        >
          <Search size={14} style={{ color: "#8b949e" }} />
          <input
            type="text"
            placeholder="Coin ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm"
            style={{ color: "#e6edf3", width: "150px" }}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "positive", "negative"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: filter === f ? "#1e80ff" : "#21262d",
                color: filter === f ? "#fff" : "#8b949e",
              }}
            >
              {f === "all" ? "Tümü" : f === "positive" ? "Pozitif" : "Negatif"}
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg p-3 mb-4 text-xs" style={{ background: "#161b22", borderColor: "#30363d", border: "1px solid #30363d", color: "#8b949e" }}>
        💡 <strong style={{ color: "#e6edf3" }}>Fonlama Oranı Nedir?</strong> Pozitif oran: Long pozisyon sahipleri short sahiplerine ödeme yapar (piyasa yükseliş eğilimli). Negatif oran: Short sahipleri long sahiplerine ödeme yapar.
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#30363d" }}>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Coin</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Fiyat</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>24s Değişim</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Fonlama Oranı</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: "#8b949e" }}>Sonraki Fonlama</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: "#8b949e" }}>Hacim (24s)</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell" style={{ color: "#8b949e" }}>Mark Fiyat</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell" style={{ color: "#8b949e" }}>Endeks Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "#30363d" }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded animate-pulse" style={{ background: "#30363d" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((item) => (
                    <tr
                      key={item.symbol}
                      className="border-t"
                      style={{ borderColor: "#30363d" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "#21262d", color: "#8b949e" }}
                          >
                            {item.baseAsset.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: "#e6edf3" }}>{item.baseAsset}</div>
                            <div className="text-xs" style={{ color: "#8b949e" }}>Perp</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: "#e6edf3" }}>
                        ${formatPrice(item.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="inline-flex items-center gap-0.5 font-medium"
                          style={{ color: item.change24h >= 0 ? "#0ecb81" : "#f6465d" }}
                        >
                          {item.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {item.change24h >= 0 ? "+" : ""}
                          {item.change24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                          style={{
                            background: item.fundingRate >= 0 ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)",
                            color: item.fundingRate >= 0 ? "#0ecb81" : "#f6465d",
                          }}
                        >
                          {item.fundingRate >= 0 ? "+" : ""}
                          {(item.fundingRate * 100).toFixed(4)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell" style={{ color: "#8b949e" }}>
                        {formatCountdown(item.nextFundingTime)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell" style={{ color: "#8b949e" }}>
                        {formatNum(item.volume24h)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden lg:table-cell" style={{ color: "#8b949e" }}>
                        ${formatPrice(item.markPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden lg:table-cell" style={{ color: "#8b949e" }}>
                        ${formatPrice(item.indexPrice)}
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
