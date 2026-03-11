import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSpotPrices, fetchSpotPricesHistory } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return null;
}

const AREA_INFO = {
  NO1: { name: "Øst-Norge", cities: "Oslo, Østfold, Hedmark", color: "#3b82f6" },
  NO2: { name: "Sør-Norge", cities: "Kristiansand, Stavanger", color: "#8b5cf6" },
  NO3: { name: "Midt-Norge", cities: "Trondheim, Møre", color: "#10b981" },
  NO4: { name: "Nord-Norge", cities: "Tromsø, Bodø", color: "#f59e0b" },
  NO5: { name: "Vest-Norge", cities: "Bergen, Sogn", color: "#ef4444" },
};

// SVG paths for each Norwegian price area (simplified polygons)
function NorwayMap({ selectedArea, onSelectArea }) {
  const areas = {
    NO1: "M 160 320 L 200 280 L 240 270 L 260 300 L 250 340 L 220 370 L 180 360 Z",
    NO2: "M 120 370 L 160 320 L 180 360 L 220 370 L 200 410 L 160 430 L 120 410 Z",
    NO5: "M 100 290 L 140 260 L 160 320 L 120 370 L 90 350 L 80 320 Z",
    NO3: "M 140 200 L 200 180 L 240 200 L 240 270 L 200 280 L 160 320 L 100 290 L 110 240 Z",
    NO4: "M 160 60 L 220 40 L 270 80 L 280 140 L 240 200 L 200 180 L 140 200 L 130 150 L 150 100 Z",
  };

  const labelPositions = {
    NO1: { x: 205, y: 325 },
    NO2: { x: 163, y: 393 },
    NO5: { x: 115, y: 335 },
    NO3: { x: 180, y: 240 },
    NO4: { x: 205, y: 135 },
  };

  return (
    <svg viewBox="0 0 360 460" style={{ width: "100%", maxWidth: 320, filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.4))" }}>
      {/* Background glow */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="selected-glow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {Object.entries(areas).map(([area, path]) => {
        const info = AREA_INFO[area];
        const isSelected = selectedArea === area;
        return (
          <g key={area} onClick={() => onSelectArea(area)} style={{ cursor: "pointer" }}>
            <path
              d={path}
              fill={isSelected ? info.color : "#1e293b"}
              stroke={isSelected ? info.color : "#334155"}
              strokeWidth={isSelected ? 2 : 1}
              opacity={isSelected ? 1 : 0.85}
              filter={isSelected ? "url(#selected-glow)" : "none"}
              style={{ transition: "all 0.2s ease" }}
            />
            <text
              x={labelPositions[area].x}
              y={labelPositions[area].y}
              textAnchor="middle"
              fill={isSelected ? "#fff" : "#94a3b8"}
              fontSize="11"
              fontWeight={isSelected ? "700" : "500"}
              fontFamily="monospace"
              style={{ pointerEvents: "none", transition: "all 0.2s ease" }}
            >
              {area}
            </text>
          </g>
        );
      })}

      {/* Svalbard hint */}
      <rect x="230" y="20" width="40" height="20" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.5" />
      <text x="250" y="34" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">SVB</text>
    </svg>
  );
}

export default function Dashboard() {
  const [area, setArea] = useState("NO1");
  const [mode, setMode] = useState("today");

  const [dataToday, setDataToday] = useState([]);
  const [dataHistory, setDataHistory] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  // TODAY
  useEffect(() => {
    if (mode !== "today") return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetchSpotPrices(area);
        const raw = unwrapArray(res.data);
        if (!raw) { if (!cancelled) { setDataToday([]); setKpi(null); } return; }

        const formatted = raw
          .map((d) => ({ time: d.time_start?.slice(11, 16) ?? "??:??", price: Number(d.NOK_per_kWh) }))
          .filter((p) => p.time && Number.isFinite(p.price));

        if (cancelled) return;
        setDataToday(formatted);

        const prices = formatted.map((p) => p.price);
        if (prices.length === 0) { setKpi(null); return; }

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const cheapest = formatted.find((p) => p.price === minPrice) || null;
        const priciest = formatted.find((p) => p.price === maxPrice) || null;
        setKpi({ cheapest, priciest, avg: avg.toFixed(3) });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [area, mode]);

  // HISTORY
  useEffect(() => {
    if (mode !== "history") return;
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);

        const res = await fetchSpotPricesHistory(area, formatDate(start), formatDate(end));
        const raw = unwrapArray(res.data);
        if (!raw) { if (!cancelled) { setDataHistory([]); setKpi(null); } return; }

        const byDate = new Map();
        for (const r of raw) {
          const d = r.date;
          const p = Number(r.NOK_per_kWh);
          if (!d || !Number.isFinite(p)) continue;
          const cur = byDate.get(d) || { sum: 0, n: 0 };
          cur.sum += p; cur.n += 1;
          byDate.set(d, cur);
        }

        const daily = Array.from(byDate.entries())
          .map(([d, v]) => ({ date: d, avg: Number((v.sum / v.n).toFixed(3)) }))
          .sort((a, b) => a.date.localeCompare(b.date));

        if (cancelled) return;
        setDataHistory(daily);

        const avgs = daily.map((x) => x.avg).filter(Number.isFinite);
        if (avgs.length === 0) { setKpi(null); return; }

        const minAvg = Math.min(...avgs);
        const maxAvg = Math.max(...avgs);
        const avgAvg = avgs.reduce((a, b) => a + b, 0) / avgs.length;
        const cheapestDay = daily.find((x) => x.avg === minAvg) || null;
        const priciestDay = daily.find((x) => x.avg === maxAvg) || null;

        setKpi({
          cheapest: cheapestDay ? { time: cheapestDay.date, price: cheapestDay.avg } : null,
          priciest: priciestDay ? { time: priciestDay.date, price: priciestDay.avg } : null,
          avg: avgAvg.toFixed(3),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => { cancelled = true; };
  }, [area, mode]);

  const chartData = mode === "today" ? dataToday : dataHistory;
  const xKey = mode === "today" ? "time" : "date";
  const yKey = mode === "today" ? "price" : "avg";
  const areaInfo = AREA_INFO[area];

  const tooltipFormatter = useMemo(() => {
    return (value) => [`${value} kr/kWh`, mode === "today" ? "Pris" : "Snitt"];
  }, [mode]);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Forecast24</div>
        <nav className="nav">
          <Link to="/" className="nav-pill">Hjem</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <main style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}>
        {/* Page title */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Velg et prisområde på kartet for å se spotpriser.</p>
        </div>

        {/* Split layout */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "2rem", alignItems: "start" }}>

          {/* LEFT — Map panel */}
          <div className="card" style={{ padding: "1.5rem", position: "sticky", top: "1rem" }}>
            <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Prisområde
            </h2>

            <NorwayMap selectedArea={area} onSelectArea={setArea} />

            {/* Selected area info */}
            <div style={{
              marginTop: "1.25rem",
              padding: "0.875rem",
              borderRadius: "0.5rem",
              background: "#0f172a",
              borderLeft: `3px solid ${areaInfo.color}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{
                  background: areaInfo.color,
                  color: "#fff",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "0.1rem 0.4rem",
                  borderRadius: "0.25rem",
                  fontFamily: "monospace",
                }}>
                  {area}
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f1f5f9" }}>{areaInfo.name}</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>{areaInfo.cities}</p>
            </div>

            {/* Area list */}
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {Object.entries(AREA_INFO).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => setArea(code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.375rem",
                    background: area === code ? "#1e293b" : "transparent",
                    border: area === code ? `1px solid ${info.color}40` : "1px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: info.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", fontFamily: "monospace", width: 32 }}>{code}</span>
                  <span style={{ fontSize: "0.75rem", color: area === code ? "#e2e8f0" : "#64748b" }}>{info.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Dashboard panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                  <span style={{ color: areaInfo.color }}>{area}</span> · {areaInfo.name}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.15rem 0 0" }}>{areaInfo.cities}</p>
              </div>

              <div className="toggle">
                <button
                  type="button"
                  className={`toggle-btn ${mode === "today" ? "is-active" : ""}`}
                  onClick={() => setMode("today")}
                >
                  I dag
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${mode === "history" ? "is-active" : ""}`}
                  onClick={() => setMode("history")}
                >
                  Siste 30 dager
                </button>
              </div>
            </div>

            {/* KPI card */}
            <section className="card kpi-card">
              <div className="kpi-head">
                <div>
                  <h2 className="kpi-title">Nøkkelinnsikt</h2>
                  <p className="kpi-sub">
                    {mode === "today" ? "Basert på dagens timespriser." : "Basert på daglig snitt (30 dager)."}
                  </p>
                </div>
                <span className={`pill ${loading ? "pill--muted" : "pill--ok"}`}>
                  {loading ? "Laster…" : "Live"}
                </span>
              </div>

              {!kpi ? (
                <p className="muted">{loading ? "Laster KPI…" : "Ingen KPI-data."}</p>
              ) : (
                <div className="kpi-table" role="table" aria-label="KPI">
                  <div className="kpi-th" role="columnheader">🔥 Dyreste {mode === "today" ? "tid" : "dag"}</div>
                  <div className="kpi-th" role="columnheader">⚡ Billigste {mode === "today" ? "tid" : "dag"}</div>
                  <div className="kpi-th" role="columnheader">📊 Snittpris</div>

                  <div className="kpi-td kpi-td--expensive" role="cell">
                    <div className="kpi-big">{kpi.priciest?.time ?? "–"}</div>
                    <div className="kpi-small">{kpi.priciest?.price ?? "–"} kr/kWh</div>
                  </div>
                  <div className="kpi-td kpi-td--cheap" role="cell">
                    <div className="kpi-big">{kpi.cheapest?.time ?? "–"}</div>
                    <div className="kpi-small">{kpi.cheapest?.price ?? "–"} kr/kWh</div>
                  </div>
                  <div className="kpi-td kpi-td--avg" role="cell">
                    <div className="kpi-big">{kpi.avg ?? "–"}</div>
                    <div className="kpi-small">kr/kWh · {area}</div>
                  </div>
                </div>
              )}
            </section>

            {/* Chart card */}
            <section className="card chart-card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">
                    {mode === "today" ? "Dagens spotpris" : "Siste 30 dager (daglig snitt)"}
                  </h2>
                  <p className="card-subtitle">
                    {mode === "today"
                      ? `Område ${area} · Data fra NVE / hvakosterstrommen.no`
                      : `Område ${area} · Daglig snitt (NOK/kWh)`}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="skeleton" style={{ height: 320 }} />
              ) : chartData.length === 0 ? (
                <p className="muted">Kunne ikke laste data for {area}.</p>
              ) : (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData}>
                      <XAxis dataKey={xKey} />
                      <YAxis domain={["auto", "auto"]} />
                      <Tooltip formatter={tooltipFormatter} />
                      <Line
                        type="monotone"
                        dataKey={yKey}
                        dot={false}
                        stroke={areaInfo.color}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Forecast24</span>
        <span className="footer-dot">•</span>
        <span>Built by Sondre Espe</span>
      </footer>
    </div>
  );
}