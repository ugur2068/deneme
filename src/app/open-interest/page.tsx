"use client";
import { useEffect, useState, useMemo } from "react";
import { Search, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface OIItem {
  symbol: string;
  baseAsset: string;
  openInterest: number;
  oiChange1h: number;
  oiUsd: number;
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

export default function OpenInterestPage() {
  const [data, setData] = useState<OIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/binance/oi");
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

  const totalOI = useMemo(() => data.reduce((s, t) => s + t.oiUsd, 0), [data]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#e6edf3" }}>Açık Pozisyon (OI)</h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            Binance Futures · Gerçek zamanlı açık pozisyon verileri
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#8b949e" }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {lastUpdate && <span>Son: {lastUpdate.toLocaleTimeString("tr-TR")}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>Toplam Açık Pozisyon</div>
          <div className="text-xl font-bold" style={{ color: "#e6edf3" }}>{formatNum(totalOI)}</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>Takip Edilen Coin</div>
          <div className="text-xl font-bold" style={{ color: "#e6edf3" }}>{data.length}</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>En Büyük OI</div>
          {data[0] && (
            <div className="text-xl font-bold" style={{ color: "#1e80ff" }}>
              {data[0].baseAsset} {formatNum(data[0].oiUsd)}
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-lg p-3 mb-4 text-xs"
        style={{ background: "#161b22", border: "1px solid #30363d", color: "#8b949e" }}
      >
        💡 <strong style={{ color: "#e6edf3" }}>Açık Pozisyon Nedir?</strong> Piyasada kapatılmamış vadeli işlem sözleşmelerinin toplam değeridir. Yüksek OI = yüksek piyasa aktivitesi.
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>#</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Coin</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Fiyat</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>24s Değişim</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Açık Pozisyon (USD)</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>1 Saat Değişim</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: "#8b949e" }}>Hacim (24s)</th>
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
                : filtered.map((item, idx) => (
                    <tr
                      key={item.symbol}
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
                      <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: "#e6edf3" }}>
                        {formatNum(item.oiUsd)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="font-medium"
                          style={{ color: item.oiChange1h >= 0 ? "#0ecb81" : "#f6465d" }}
                        >
                          {item.oiChange1h >= 0 ? "+" : ""}
                          {item.oiChange1h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell" style={{ color: "#8b949e" }}>
                        {formatNum(item.volume24h)}
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
