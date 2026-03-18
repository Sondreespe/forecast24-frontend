import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { fetchModelEvaluation } from "../api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const MODELS = [
  {
    id: "baseline",
    name: "Baseline",
    tagline: "Enkel men effektiv",
    description:
      "Predikerer morgendagens priser basert på gjennomsnittet av samme tidspunkt de siste 7 dagene. Et solid referansepunkt for å måle mer avanserte modeller mot.",
    tech: ["Python", "NumPy", "Pandas"],
    status: "klar",
    complexity: 1,
    details: [
      { label: "Metode", value: "7-dagers rullende snitt" },
      { label: "Input", value: "Historiske timespriser" },
      { label: "Output", value: "24 timers prediksjon" },
      { label: "Treningsdata", value: "NO1–NO5, siste 30 dager" },
    ],
  },
  {
    id: "xgboost",
    name: "XGBoost",
    tagline: "Gradient boosting på tidsseriedata",
    description:
      "Bruker gradient boosting med engineered features som time på dagen, ukedag og laggede priser. Fanger ikke-lineære mønstre som baseline ikke klarer.",
    tech: ["XGBoost", "Scikit-learn", "Pandas"],
    status: "klar",
    complexity: 3,
    details: [
      { label: "Metode", value: "Gradient Boosted Trees" },
      { label: "Input", value: "Lag-features, tid, ukedag" },
      { label: "Output", value: "24 timers prediksjon" },
      { label: "Treningsdata", value: "NO1–NO5, historikk" },
    ],
  },
  {
    id: "prophet",
    name: "Prophet",
    tagline: "Sesongbasert tidsseriemodell",
    description:
      "Facebooks Prophet-modell er designet for tidsseriedata med sterke sesongmønstre — daglige, ukentlige og årstidsbaserte svingninger i strømpris.",
    tech: ["Prophet", "Python", "Pandas"],
    status: "under utvikling",
    complexity: 2,
    details: [
      { label: "Metode", value: "Additiv dekomposisjon" },
      { label: "Input", value: "Historiske timespriser" },
      { label: "Output", value: "24–168 timers prediksjon" },
      { label: "Treningsdata", value: "NO1–NO5, historikk" },
    ],
  },
  {
    id: "lstm",
    name: "LSTM",
    tagline: "Dyp læring for sekvensdata",
    description:
      "Long Short-Term Memory nettverk husker langsiktige avhengigheter i prisdata. Den mest avanserte modellen — men også den som krever mest data og treningsressurser.",
    tech: ["TensorFlow", "Keras", "Python"],
    status: "planlagt",
    complexity: 5,
    details: [
      { label: "Metode", value: "Rekurrent nevralt nettverk" },
      { label: "Input", value: "Sekvenser av timespriser" },
      { label: "Output", value: "24 timers prediksjon" },
      { label: "Treningsdata", value: "NO1–NO5, full historikk" },
    ],
  },
];

const STATUS_STYLE = {
  klar: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Klar" },
  "under utvikling": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Under utvikling" },
  planlagt: { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Planlagt" },
};

const COMPLEXITY_LABELS = ["", "Enkel", "Lav", "Middels", "Høy", "Avansert"];

function ComplexityBar({ level }) {
  return (
    <div className="complexity-bar">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`complexity-segment ${i <= level ? "is-active" : ""}`}
          style={i <= level ? { background: `hsl(${220 - i * 25}, 80%, 60%)` } : {}}
        />
      ))}
    </div>
  );
}

export default function Features() {
  const [selected, setSelected] = useState(MODELS[0]);
  const [evalView, setEvalView] = useState(false);
  const [evalData, setEvalData] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLE[selected.status];

  useEffect(() => {
    setEvalView(false);
    setEvalData(null);
  }, [selected]);

  async function loadEval() {
    setEvalView(true);
    setEvalLoading(true);
    setEvalData(null);
    try {
      const res = await fetchModelEvaluation(selected.id, "NO1");
      setEvalData(res.data);
    } catch {
      setEvalData({ status: "error", message: "Kunne ikke laste evalueringsdata." });
    } finally {
      setEvalLoading(false);
    }
  }

  return (
    <div className="app">
      <Navbar />

      <main className="features-main">
        <div className="features-intro">
          <p className="badge">Modeller · Prediksjon</p>
          <h1 className="features-title">
            Velg en <span className="accent">prediksjonsmodell</span>
          </h1>
          <p className="features-subtitle">
            Sammenlign ulike tilnærminger til strømprisprediksjon — fra enkle
            statistiske metoder til avansert dyp læring.
          </p>
        </div>

        <div className="features-split">

          {/* LEFT — Model list */}
          <div className="model-list">
            {MODELS.map((model) => {
              const s = STATUS_STYLE[model.status];
              const isActive = selected.id === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => setSelected(model)}
                  className={`model-list-item ${isActive ? "is-active" : ""}`}
                >
                  <div className="model-list-top">
                    <span className="model-list-name">{model.name}</span>
                    <span
                      className="model-status-pill"
                      style={{ color: s.color, background: s.bg }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="model-list-tagline">{model.tagline}</p>
                  <div className="model-list-tech">
                    {model.tech.map((t) => (
                      <span key={t} className="tech-tag">{t}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT — Model detail */}
          <div className="model-detail card">

            <div className="model-detail-header">
              <div>
                <div className="model-detail-top">
                  <h2 className="model-detail-name">{selected.name}</h2>
                  <span
                    className="model-status-pill model-status-pill--lg"
                    style={{ color: statusStyle.color, background: statusStyle.bg }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                <p className="model-detail-tagline">{selected.tagline}</p>
              </div>

              <div className="model-complexity">
                <span className="complexity-label">
                  Kompleksitet — {COMPLEXITY_LABELS[selected.complexity]}
                </span>
                <ComplexityBar level={selected.complexity} />
              </div>
            </div>

            <p className="model-detail-description">{selected.description}</p>

            <div className="model-detail-grid">
              {selected.details.map((d) => (
                <div key={d.label} className="model-detail-item">
                  <span className="model-detail-label">{d.label}</span>
                  <span className="model-detail-value">{d.value}</span>
                </div>
              ))}
            </div>

            <div className="model-tech-stack">
              <span className="model-tech-heading">Teknologi</span>
              <div className="model-tech-list">
                {selected.tech.map((t) => (
                  <span key={t} className="tech-tag tech-tag--lg">{t}</span>
                ))}
              </div>
            </div>

            <div className="model-detail-actions">
              {selected.status === "klar" ? (
                <>
                  <button
                    className="primary-btn"
                    onClick={() => navigate(`/dashboard?model=${selected.id}`)}
                  >
                    Se prediksjon i dashboard
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={loadEval}
                  >
                    Se prestasjon i dag
                  </button>
                </>
              ) : (
                <button className="secondary-btn" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                  Ikke tilgjengelig ennå
                </button>
              )}
            </div>
          </div>
        </div>

        {evalView && (
          <div className="eval-panel card" style={{ marginTop: "2rem" }}>
            <div className="eval-header">
              <div>
                <h2 className="card-title">{selected.name} — Prestasjon i dag</h2>
                <p className="card-subtitle">NO1 · Prediksjon vs faktisk pris (NOK/kWh)</p>
              </div>
              <button className="secondary-btn" onClick={() => setEvalView(false)}>
                Lukk
              </button>
            </div>

            {evalLoading && <div className="skeleton" style={{ height: 280, marginTop: "1rem" }} />}

            {!evalLoading && evalData && evalData.status === "incomplete" && (
              <p className="muted" style={{ marginTop: "1rem" }}>
                {evalData.message}
              </p>
            )}

            {!evalLoading && evalData && evalData.status === "error" && (
              <p className="muted" style={{ marginTop: "1rem" }}>
                Feil: {evalData.detail || evalData.message}
              </p>
            )}

            {!evalLoading && evalData && evalData.status === "ok" && (
              <>
                <div className="eval-metrics">
                  <div className="eval-metric-card">
                    <span className="eval-metric-label">MAE</span>
                    <span className="eval-metric-value">{evalData.metrics.mae}</span>
                    <span className="eval-metric-unit">kr/kWh · snitt absolutt feil</span>
                  </div>
                  <div className="eval-metric-card">
                    <span className="eval-metric-label">RMSE</span>
                    <span className="eval-metric-value">{evalData.metrics.rmse}</span>
                    <span className="eval-metric-unit">kr/kWh · straffer store avvik</span>
                  </div>
                  <div className="eval-metric-card">
                    <span className="eval-metric-label">MAPE</span>
                    <span className="eval-metric-value">{evalData.metrics.mape}%</span>
                    <span className="eval-metric-unit">prosentvis feil</span>
                  </div>
                  <div className="eval-metric-card eval-metric-card--best">
                    <span className="eval-metric-label">Beste time</span>
                    <span className="eval-metric-value">{String(evalData.best_hour).padStart(2,"0")}:00</span>
                    <span className="eval-metric-unit">minst avvik</span>
                  </div>
                  <div className="eval-metric-card eval-metric-card--worst">
                    <span className="eval-metric-label">Verste time</span>
                    <span className="eval-metric-value">{String(evalData.worst_hour).padStart(2,"0")}:00</span>
                    <span className="eval-metric-unit">størst avvik</span>
                  </div>
                </div>

                <div className="chart-wrapper" style={{ marginTop: "1.5rem" }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={evalData.points.filter(p => p.actual != null || p.predicted != null)}>
                      <XAxis dataKey="time" />
                      <YAxis domain={["auto", "auto"]} />
                      <Tooltip formatter={(v) => v != null ? `${v} kr/kWh` : "–"} />
                      <Legend />
                      <Line type="monotone" dataKey="actual" name="Faktisk" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="predicted" name={selected.name} stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Forecast24</span>
        <span className="footer-dot">•</span>
        <span>Built by Sondre Espe</span>
      </footer>
    </div>
  );
}