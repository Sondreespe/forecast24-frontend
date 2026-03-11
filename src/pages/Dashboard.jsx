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

function NorwayMap({ selectedArea, onSelectArea }) {
  const areas = {
    // NO4: Long thin northern strip
    NO4: "M 155 10 L 175 8 L 195 20 L 210 45 L 215 75 L 210 105 L 205 130 L 195 155 L 185 175 L 175 185 L 160 190 L 148 185 L 140 175 L 138 160 L 142 140 L 145 115 L 143 90 L 140 65 L 142 40 L 148 20 Z",
    // NO3: Middle section - Trondheim area
    NO3: "M 138 160 L 148 185 L 160 190 L 175 185 L 185 175 L 195 155 L 195 210 L 185 235 L 170 255 L 155 265 L 140 268 L 125 262 L 112 248 L 105 230 L 108 210 L 118 195 L 128 178 Z",
    // NO1: East Norway - Oslo area
    NO1: "M 140 268 L 155 265 L 170 255 L 185 235 L 195 210 L 200 240 L 198 265 L 192 285 L 185 305 L 178 325 L 172 345 L 165 360 L 155 370 L 142 372 L 132 365 L 125 350 L 122 330 L 122 308 L 125 285 L 128 268 Z",
    // NO5: West Norway - Bergen area
    NO5: "M 105 230 L 112 248 L 125 262 L 128 268 L 122 285 L 112 295 L 100 298 L 88 292 L 80 278 L 80 258 L 86 242 L 96 233 Z",
    // NO2: Southern Norway
    NO2: "M 88 292 L 100 298 L 112 295 L 122 308 L 122 330 L 125 350 L 132 365 L 142 372 L 148 385 L 142 398 L 130 408 L 115 412 L 100 408 L 85 398 L 75 382 L 70 362 L 72 340 L 76 318 L 80 300 Z",
  };

  const labelPositions = {
    NO4: { x: 178, y: 100 },
    NO3: { x: 155, y: 225 },
    NO1: { x: 165, y: 318 },
    NO5: { x: 94, y: 268 },
    NO2: { x: 108, y: 360 },
  };

  return (
    <svg viewBox="0 60 260 380" className="norway-map">
      <defs>
        <filter id="selected-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
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
          <g key={area} onClick={() => onSelectArea(area)} className="map-area">
            <path
              d={path}
              fill={isSelected ? info.color : "#1e293b"}
              stroke={isSelected ? info.color : "#475569"}
              strokeWidth={isSelected ? 2 : 1}
              opacity={isSelected ? 1 : 0.8}
              filter={isSelected ? "url(#selected-glow)" : "none"}
              className="map-path"
            />
            <text
              x={labelPositions[area].x}
              y={labelPositions[area].y}
              textAnchor="middle"
              fill={isSelected ? "#fff" : "#94a3b8"}
              fontSize="10"
              fontWeight={isSelected ? "700" : "500"}
              fontFamily="monospace"
              className="map-label"
            >
              {area}
            </text>
          </g>
        );
      })}
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
    <div className="app dashboard-page">
      <header className="header">
        <div className="logo">Forecast24</div>
        <nav className="nav">
          <Link to="/" className="nav-pill">Hjem</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-intro">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Velg et prisområde på kartet for å se spotpriser.</p>
        </div>

        <div className="dashboard-split">

          {/* LEFT — Map panel */}
          <div className="card map-panel">
            <h2 className="map-panel-heading">Prisområde</h2>

            <NorwayMap selectedArea={area} onSelectArea={setArea} />

            <div className="area-info-box" style={{ borderLeftColor: areaInfo.color }}>
              <div className="area-info-top">
                <span className="area-badge" style={{ background: areaInfo.color }}>{area}</span>
                <span className="area-name">{areaInfo.name}</span>
              </div>
              <p className="area-cities">{areaInfo.cities}</p>
            </div>

            <div className="area-list">
              {Object.entries(AREA_INFO).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => setArea(code)}
                  className={`area-list-btn ${area === code ? "is-active" : ""}`}
                  style={area === code ? { borderColor: `${info.color}40` } : {}}
                >
                  <span className="area-dot" style={{ background: info.color }} />
                  <span className="area-code">{code}</span>
                  <span className="area-label">{info.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Data panel */}
          <div className="dashboard-right">

            <div className="dashboard-right-header">
              <div>
                <h2 className="area-title">
                  <span style={{ color: areaInfo.color }}>{area}</span> · {areaInfo.name}
                </h2>
                <p className="area-subtitle">{areaInfo.cities}</p>
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
                <div className="chart-wrapper">
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