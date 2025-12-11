import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSpotPrices } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AREAS = ["NO1", "NO2", "NO3", "NO4", "NO5"];

export default function Dashboard() {
  const [area, setArea] = useState("NO1");
  const [data, setData] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetchSpotPrices(area);
        const raw = res.data;

        if (!Array.isArray(raw)) {
          if (!cancelled) {
            setData([]);
            setKpi(null);
          }
          return;
        }

        const formatted = raw.map((d) => ({
          time: d.time_start?.slice(11, 16) ?? "??:??",
          price: Number(d.NOK_per_kWh),
        }));

        if (cancelled) return;

        setData(formatted);

        const prices = formatted
          .map((p) => p.price)
          .filter((p) => Number.isFinite(p));

        if (prices.length === 0) {
          setKpi(null);
          return;
        }

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

        const cheapest = formatted.find((p) => p.price === minPrice);
        const priciest = formatted.find((p) => p.price === maxPrice);

        setKpi({
          cheapest,
          priciest,
          avg: avg.toFixed(3),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [area]);

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
          </div>
        </div>

        {kpi && (
          <section className="kpi-grid">
            <div className="card kpi-card">
              <div className="kpi-label">Billigste time</div>
              <div className="kpi-value">{kpi.cheapest?.time ?? "–"}</div>
              <div className="kpi-sub">
                {kpi.cheapest?.price ?? "–"} kr/kWh
              </div>
            </div>

            <div className="card kpi-card">
              <div className="kpi-label">Dyreste time</div>
              <div className="kpi-value">{kpi.priciest?.time ?? "–"}</div>
              <div className="kpi-sub">
                {kpi.priciest?.price ?? "–"} kr/kWh
              </div>
            </div>

            <div className="card kpi-card">
              <div className="kpi-label">Snittpris</div>
              <div className="kpi-value">{kpi.avg}</div>
              <div className="kpi-sub">kr/kWh</div>
            </div>
          </section>
        )}

        <section className="card chart-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Dagens spotpris</h2>
              <p className="card-subtitle">
                Område {area} · Data fra NVE / hvakosterstrommen.no
              </p>
            </div>
            <span className={`pill ${loading ? "pill--muted" : "pill--ok"}`}>
              {loading ? "Laster…" : "Live"}
            </span>
          </div>

          
          {loading ? (
            <div className="skeleton" style={{ height: 320 }} />
          ) : data.length === 0 ? (
            <p className="muted">Kunne ikke laste data for {area}.</p>
          ) : (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data}>
                  <XAxis dataKey="time" />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" dot={false} />
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