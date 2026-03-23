"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface FearGreedData {
  value: number;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

interface FearGreedResponse {
  data: FearGreedData[];
}

function getColor(value: number): string {
  if (value <= 25) return "#f6465d";
  if (value <= 45) return "#e67e22";
  if (value <= 55) return "#f1c40f";
  if (value <= 75) return "#2ecc71";
  return "#0ecb81";
}

function getLabel(classification: string): string {
  const map: Record<string, string> = {
    "Extreme Fear": "Aşırı Korku",
    "Fear": "Korku",
    "Neutral": "Nötr",
    "Greed": "Açgözlülük",
    "Extreme Greed": "Aşırı Açgözlülük",
  };
  return map[classification] || classification;
}

function GaugeMeter({ value }: { value: number }) {
  const angle = -90 + (value / 100) * 180;
  const color = getColor(value);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-64 h-36">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#21262d"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Colored segments */}
        {[
          { color: "#f6465d", start: 0, end: 25 },
          { color: "#e67e22", start: 25, end: 45 },
          { color: "#f1c40f", start: 45, end: 55 },
          { color: "#2ecc71", start: 55, end: 75 },
          { color: "#0ecb81", start: 75, end: 100 },
        ].map((seg) => {
          const startAngle = ((seg.start / 100) * 180 - 90) * (Math.PI / 180);
          const endAngle = ((seg.end / 100) * 180 - 90) * (Math.PI / 180);
          const r = 80;
          const cx = 100;
          const cy = 100;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const largeArc = seg.end - seg.start > 50 ? 1 : 0;
          return (
            <path
              key={seg.color}
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.6"
            />
          );
        })}
        {/* Needle */}
        <g transform={`rotate(${angle}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="28" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill={color} />
        </g>
        {/* Value text */}
        <text x="100" y="95" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>
          {value}
        </text>
      </svg>
    </div>
  );
}

export default function FearGreedPage() {
  const [data, setData] = useState<FearGreedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=30&format=json");
        if (!res.ok) throw new Error("Failed");
        const json: FearGreedResponse = await res.json();
        setData(json.data || []);
      } catch {
        setError(true);
        // Fallback mock data
        setData([
          { value: 62, value_classification: "Greed", timestamp: Date.now().toString(), time_until_update: "3600" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const current = data[0];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#e6edf3" }}>Korku & Açgözlülük Endeksi</h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            Kripto piyasası duyarlılık endeksi · alternative.me
          </p>
        </div>
        {loading && <RefreshCw size={16} className="animate-spin" style={{ color: "#8b949e" }} />}
      </div>

      {/* Current Value */}
      {current && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div
            className="rounded-lg p-8 border flex flex-col items-center"
            style={{ background: "#161b22", borderColor: "#30363d" }}
          >
            <h2 className="text-sm font-medium mb-4" style={{ color: "#8b949e" }}>Bugün</h2>
            <GaugeMeter value={current.value} />
            <div className="text-3xl font-bold mt-2" style={{ color: getColor(current.value) }}>
              {getLabel(current.value_classification)}
            </div>
            <div className="text-5xl font-bold mt-1" style={{ color: getColor(current.value) }}>
              {current.value}
            </div>
            {!error && (
              <div className="text-xs mt-3" style={{ color: "#8b949e" }}>
                Sonraki güncelleme: ~{Math.floor(parseInt(current.time_until_update || "3600") / 3600)}s
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div
              className="rounded-lg p-4 border"
              style={{ background: "#161b22", borderColor: "#30363d" }}
            >
              <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>Endeks Kategorileri</h3>
              <div className="space-y-2">
                {[
                  { label: "Aşırı Korku", range: "0-25", color: "#f6465d" },
                  { label: "Korku", range: "26-45", color: "#e67e22" },
                  { label: "Nötr", range: "46-55", color: "#f1c40f" },
                  { label: "Açgözlülük", range: "56-75", color: "#2ecc71" },
                  { label: "Aşırı Açgözlülük", range: "76-100", color: "#0ecb81" },
                ].map((cat) => (
                  <div key={cat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                      <span className="text-sm" style={{ color: "#e6edf3" }}>{cat.label}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: "#8b949e" }}>{cat.range}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg p-4 border"
              style={{ background: "#161b22", borderColor: "#30363d" }}
            >
              <h3 className="text-sm font-medium mb-2" style={{ color: "#8b949e" }}>Endeks Hakkında</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#8b949e" }}>
                Kripto Korku & Açgözlülük Endeksi, piyasadaki duyarlılığı ölçer. 
                Aşırı korku dönemlerinde yatırımcılar panik satışı yapar ve bu alım fırsatı olabilir. 
                Aşırı açgözlülük dönemlerinde ise piyasa aşırı ısınmış olabilir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Data */}
      {data.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "#e6edf3" }}>Son 30 Gün</h2>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#30363d" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Tarih</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Değer</th>
                  <th className="text-right px-4 py-3 font-medium" style={{ color: "#8b949e" }}>Kategori</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 30).map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-t"
                    style={{ borderColor: "#30363d" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3" style={{ color: "#8b949e" }}>
                      {new Date(parseInt(item.timestamp) * 1000).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div
                          className="w-16 h-2 rounded overflow-hidden"
                          style={{ background: "#21262d" }}
                        >
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${item.value}%`,
                              background: getColor(item.value),
                            }}
                          />
                        </div>
                        <span className="font-bold w-8" style={{ color: getColor(item.value) }}>
                          {item.value}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: getColor(item.value) + "26",
                          color: getColor(item.value),
                        }}
                      >
                        {getLabel(item.value_classification)}
                      </span>
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
