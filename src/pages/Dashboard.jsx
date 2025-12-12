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

const AREAS = ["NO1", "NO2", "NO3", "NO4", "NO5"];

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// støtter både [..] og {data:[..]}
function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return null;
}

export default function Dashboard() {
  const [area, setArea] = useState("NO1");
  const [mode, setMode] = useState("today"); // "today" | "history"

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

        if (!raw) {
          if (!cancelled) {
            setDataToday([]);
            setKpi(null);
          }
          return;
        }

        const formatted = raw
          .map((d) => ({
            time: d.time_start?.slice(11, 16) ?? "??:??",
            price: Number(d.NOK_per_kWh),
          }))
          .filter((p) => p.time && Number.isFinite(p.price));

        if (cancelled) return;

        setDataToday(formatted);

        const prices = formatted.map((p) => p.price);
        if (prices.length === 0) {
          setKpi(null);
          return;
        }

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
    return () => {
      cancelled = true;
    };
  }, [area, mode]);

  // HISTORY (30d daglig snitt)
  useEffect(() => {
    if (mode !== "history") return;

    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);

        const startStr = formatDate(start);
        const endStr = formatDate(end);

        const res = await fetchSpotPricesHistory(area, startStr, endStr);
        const raw = unwrapArray(res.data);

        if (!raw) {
          if (!cancelled) {
            setDataHistory([]);
            setKpi(null);
          }
          return;
        }

        const byDate = new Map();
        for (const r of raw) {
          const d = r.date;
          const p = Number(r.NOK_per_kWh);
          if (!d || !Number.isFinite(p)) continue;

          const cur = byDate.get(d) || { sum: 0, n: 0 };
          cur.sum += p;
          cur.n += 1;
          byDate.set(d, cur);
        }

        const daily = Array.from(byDate.entries())
          .map(([d, v]) => ({
            date: d,
            avg: Number((v.sum / v.n).toFixed(3)),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        if (cancelled) return;

        setDataHistory(daily);

        const avgs = daily.map((x) => x.avg).filter(Number.isFinite);
        if (avgs.length === 0) {
          setKpi(null);
          return;
        }

        const minAvg = Math.min(...avgs);
        const maxAvg = Math.max(...avgs);
        const avgAvg = avgs.reduce((a, b) => a + b, 0) / avgs.length;

        const cheapestDay = daily.find((x) => x.avg === minAvg) || null;
        const priciestDay = daily.find((x) => x.avg === maxAvg) || null;

        setKpi({
          cheapest: cheapestDay
            ? { time: cheapestDay.date, price: cheapestDay.avg }
            : null,
          priciest: priciestDay
            ? { time: priciestDay.date, price: priciestDay.avg }
            : null,
          avg: avgAvg.toFixed(3),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [area, mode]);

  const chartData = mode === "today" ? dataToday : dataHistory;
  const xKey = mode === "today" ? "time" : "date";
  const yKey = mode === "today" ? "price" : "avg";

  const title =
    mode === "today" ? "Dagens spotpris" : "Siste 30 dager (daglig snitt)";
  const subtitle =
    mode === "today"
      ? `Område ${area} · Data fra NVE / hvakosterstrommen.no`
      : `Område ${area} · Daglig snitt (NOK/kWh)`;

  const tooltipFormatter = useMemo(() => {
    return (value) => [`${value} kr/kWh`, mode === "today" ? "Pris" : "Snitt"];
  }, [mode]);

  const expensiveLabel = `🔥 Dyreste ${mode === "today" ? "tid" : "dag"}`;
  const cheapLabel = `⚡ Billigste ${mode === "today" ? "tid" : "dag"}`;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Forecast24</div>
        <nav className="nav">
          <Link to="/" className="nav-pill">
            Hjem
          </Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <main className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              Live spotpriser og nøkkelinnsikt per område.
            </p>
          </div>

          <div className="dashboard-controls">
            <label className="control-label">
              Område
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="select"
              >
                {AREAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>

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
        </div>

        {/* KPI (EN card) */}
        <section className="card kpi-card">
          <div className="kpi-head">
            <div>
              <h2 className="kpi-title">Nøkkelinnsikt</h2>
              <p className="kpi-sub">
                {mode === "today"
                  ? "Basert på dagens timespriser."
                  : "Basert på daglig snitt (30 dager)."}
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
              {/* Header row */}
              <div className="kpi-th" role="columnheader">
                {expensiveLabel}
              </div>
              <div className="kpi-th" role="columnheader">
                {cheapLabel}
              </div>
              <div className="kpi-th" role="columnheader">
                📊 Snittpris
              </div>

              {/* Value row */}
              <div className="kpi-td kpi-td--expensive" role="cell">
                <div className="kpi-big">{kpi.priciest?.time ?? "–"}</div>
                <div className="kpi-small">
                  {kpi.priciest?.price ?? "–"} kr/kWh
                </div>
              </div>

              <div className="kpi-td kpi-td--cheap" role="cell">
                <div className="kpi-big">{kpi.cheapest?.time ?? "–"}</div>
                <div className="kpi-small">
                  {kpi.cheapest?.price ?? "–"} kr/kWh
                </div>
              </div>

              <div className="kpi-td kpi-td--avg" role="cell">
                <div className="kpi-big">{kpi.avg ?? "–"}</div>
                <div className="kpi-small">kr/kWh · {area}</div>
              </div>
            </div>
          )}
        </section>

        {/* Graf */}
        <section className="card chart-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">{title}</h2>
              <p className="card-subtitle">{subtitle}</p>
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
                  <Line type="monotone" dataKey={yKey} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Forecast24</span>
        <span className="footer-dot">•</span>
        <span>Built by Sondre Espe</span>
      </footer>
    </div>
  );
}