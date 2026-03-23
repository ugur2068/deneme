"use client";
import { useEffect, useState, useMemo } from "react";
import { RefreshCw, Zap } from "lucide-react";

interface GroupedItem {
  symbol: string;
  baseAsset: string;
  buyCount: number;
  sellCount: number;
  buyUsd: number;
  sellUsd: number;
  total: number;
  price: number;
}

interface RecentItem {
  symbol: string;
  baseAsset: string;
  side: string;
  qty: number;
  price: number;
  usd: number;
  time: number;
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

export default function LiquidationsPage() {
  const [grouped, setGrouped] = useState<GroupedItem[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [view, setView] = useState<"grouped" | "recent">("grouped");

  async function fetchData() {
    try {
      const res = await fetch("/api/binance/liquidations");
      if (!res.ok) return;
      const json = await res.json();
      if (json.grouped) setGrouped(json.grouped);
      if (json.recent) setRecent(json.recent);
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

  const totalLiqUsd = useMemo(() => grouped.reduce((s, t) => s + t.total, 0), [grouped]);
  const totalLongs = useMemo(() => grouped.reduce((s, t) => s + t.sellUsd, 0), [grouped]);
  const totalShorts = useMemo(() => grouped.reduce((s, t) => s + t.buyUsd, 0), [grouped]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#e6edf3" }}>
            <Zap size={22} className="inline mr-2 text-yellow-400" />
            Tasfiyeler (Likidasyonlar)
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            Binance Futures · Son tasfiye emirleri
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#8b949e" }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {lastUpdate && <span>Son: {lastUpdate.toLocaleTimeString("tr-TR")}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>Toplam Tasfiye</div>
          <div className="text-xl font-bold" style={{ color: "#e6edf3" }}>{formatNum(totalLiqUsd)}</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>Long Tasfiye</div>
          <div className="text-xl font-bold" style={{ color: "#f6465d" }}>{formatNum(totalLongs)}</div>
        </div>
        <div className="rounded-lg p-4 border" style={{ background: "#161b22", borderColor: "#30363d" }}>
          <div className="text-xs mb-1" style={{ color: "#8b949e" }}>Short Tasfiye</div>
          <div className="text-xl font-bold" style={{ color: "#0ecb81" }}>{formatNum(totalShorts)}</div>
        </div>
      </div>

      <div
        className="rounded-lg p-3 mb-4 text-xs"
        style={{ background: "#161b22", border: "1px solid #30363d", color: "#8b949e" }}
      >
        💡 <strong style={{ color: "#e6edf3" }}>Tasfiye Nedir?</strong> Bir trader'ın marjini, pozisyonu sürdürmek için yetersiz kaldığında pozisyon zorla kapatılır. BUY = short pozisyon tasfiyesi, SELL = long pozisyon tasfiyesi.
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        {(["grouped", "recent"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              background: view === v ? "#1e80ff" : "#21262d",
              color: view === v ? "#fff" : "#8b949e",
            }}
          >
            {v === "grouped" ? "Coin Bazlı" : "Son Tasfiyeler"}
          </button>
        ))}
      </div>

      {view === "grouped" ? (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#30363d" }}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>#</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Coin</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Toplam Tasfiye</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#f6465d" }}>Long Tasfiye</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#0ecb81" }}>Short Tasfiye</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell" style={{ color: "#8b949e" }}>Fiyat</th>
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
                  : grouped.map((item, idx) => (
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
                            <div className="font-semibold" style={{ color: "#e6edf3" }}>{item.baseAsset}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: "#e6edf3" }}>
                          {formatNum(item.total)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: "#f6465d" }}>
                          {formatNum(item.sellUsd)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: "#0ecb81" }}>
                          {formatNum(item.buyUsd)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono hidden md:table-cell" style={{ color: "#8b949e" }}>
                          ${formatPrice(item.price)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#30363d" }}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Coin</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Yön</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Fiyat</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Miktar</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>USD Değer</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Zaman</th>
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
                  : recent.map((item, idx) => (
                      <tr
                        key={idx}
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
                        <td className="px-4 py-3 text-right">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                            style={{
                              background: item.side === "BUY" ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)",
                              color: item.side === "BUY" ? "#0ecb81" : "#f6465d",
                            }}
                          >
                            {item.side === "BUY" ? "Short Tasfiye" : "Long Tasfiye"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: "#e6edf3" }}>
                          ${formatPrice(item.price)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: "#8b949e" }}>
                          {item.qty.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: "#e6edf3" }}>
                          {formatNum(item.usd)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs" style={{ color: "#8b949e" }}>
                          {new Date(item.time).toLocaleTimeString("tr-TR")}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
