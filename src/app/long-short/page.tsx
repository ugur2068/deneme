"use client";
import { useEffect, useState, useMemo } from "react";
import { Search, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface LSItem {
  symbol: string;
  baseAsset: string;
  globalLong: number;
  globalShort: number;
  globalRatio: number;
  topAccLong: number;
  topAccShort: number;
  topPosLong: number;
  topPosShort: number;
  price: number;
  change24h: number;
}

function formatPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toFixed(6);
}

function RatioBar({ long, short }: { long: number; short: number }) {
  const longPct = Math.min(100, Math.max(0, long));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs w-10 text-right" style={{ color: "#0ecb81" }}>
        {longPct.toFixed(1)}%
      </span>
      <div className="flex-1 h-2 rounded overflow-hidden" style={{ background: "#f6465d", minWidth: "80px" }}>
        <div
          className="h-full rounded-l"
          style={{ width: `${longPct}%`, background: "#0ecb81" }}
        />
      </div>
      <span className="text-xs w-10" style={{ color: "#f6465d" }}>
        {(100 - longPct).toFixed(1)}%
      </span>
    </div>
  );
}

export default function LongShortPage() {
  const [data, setData] = useState<LSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/binance/longshort");
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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return data.filter(
      (t) =>
        t.baseAsset.toLowerCase().includes(search.toLowerCase()) ||
        t.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const avgGlobalLong = useMemo(() => {
    if (!data.length) return 50;
    return data.reduce((s, t) => s + t.globalLong, 0) / data.length;
  }, [data]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#e6edf3" }}>Long/Short Oranı</h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            Binance Futures · Global ve top trader long/short pozisyon oranları
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#8b949e" }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {lastUpdate && <span>Son: {lastUpdate.toLocaleTimeString("tr-TR")}</span>}
        </div>
      </div>

      {/* Market Sentiment */}
      <div className="rounded-lg p-6 border mb-6" style={{ background: "#161b22", borderColor: "#30363d" }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: "#8b949e" }}>Global Piyasa Duyarlılığı</h2>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-2xl font-bold" style={{ color: "#0ecb81" }}>
            Long {avgGlobalLong.toFixed(1)}%
          </span>
          <span className="text-2xl font-bold" style={{ color: "#f6465d" }}>
            Short {(100 - avgGlobalLong).toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-4 rounded overflow-hidden" style={{ background: "#f6465d" }}>
          <div
            className="h-full rounded-l transition-all duration-500"
            style={{ width: `${avgGlobalLong}%`, background: "#0ecb81" }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "#8b949e" }}>
          <span>Long (Yükseliş beklentisi)</span>
          <span>Short (Düşüş beklentisi)</span>
        </div>
      </div>

      <div
        className="rounded-lg p-3 mb-4 text-xs"
        style={{ background: "#161b22", border: "1px solid #30363d", color: "#8b949e" }}
      >
        💡 <strong style={{ color: "#e6edf3" }}>Long/Short Oranı:</strong> Piyasada long (yükseliş) ve short (düşüş) pozisyon tutan trader oranını gösterir. 50%+ Long = piyasa genel olarak yükseliş bekliyor.
      </div>

      <div className="flex items-center gap-3 mb-4">
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
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#30363d" }}>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Coin</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Fiyat</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>24s Değişim</th>
                <th className="px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Global L/S Oranı</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell" style={{ color: "#8b949e" }}>Top Trader Hesap L/S</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell" style={{ color: "#8b949e" }}>Top Trader Pozisyon L/S</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "#30363d" }}>
                      {Array.from({ length: 6 }).map((_, j) => (
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
                          <div className="font-semibold" style={{ color: "#e6edf3" }}>{item.baseAsset}</div>
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
                      <td className="px-4 py-3">
                        <RatioBar long={item.globalLong} short={item.globalShort} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <RatioBar long={item.topAccLong} short={item.topAccShort} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <RatioBar long={item.topPosLong} short={item.topPosShort} />
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
