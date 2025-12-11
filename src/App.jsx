import { useEffect, useState } from "react";
import { fetchForecast } from "./api";
import { SpotPriceChart } from "./components/SpotPriceChart";



function App() {
  const [forecastInfo, setForecastInfo] = useState(null);
  const [forecastError, setForecastError] = useState(null);

  useEffect(() => {
    fetchForecast()
      .then((data) => setForecastInfo(data))
      .catch((err) => setForecastError(err.message));
  },  []);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">Forecast24</div>
        <nav className="nav">
          <a href="#about">Om</a>
          <a href="#features">Funksjoner</a>
          <a href="#dashboard" className="nav-pill">
            Dashboard (kommer)
          </a>
        </nav>
      </header>

      <main className="hero">
        <section className="hero-content">
          <p className="badge">Strømpris · Time series forecasting</p>
          <h1>
            Prediksjon av strømpris
            <span className="accent"> de neste 24 timene</span>
          </h1>
          <p className="subtitle">
            Forecast24 analyserer historiske strømpriser og gir et klart bilde av
            hvordan prisene utvikler seg den neste dagen. Perfekt for både
            forbrukere og bedrifter som vil planlegge strømforbruk smartere.
          </p>

          <div className="hero-actions">
            <button className="primary-btn" id="dashboard">
              Åpne dashboard (kommer)
            </button>
            <button className="secondary-btn">
              Les mer om hvordan det funker
            </button>
          </div>

          <ul className="bullet-list" id="features">
            <li>⚡ Time-for-time prognose for de neste 24 timene</li>
            <li>📈 Kombinerer historiske priser og mønstre i dataene</li>
            <li>🧠 Bygget med moderne data science- og ML-teknikker</li>
          </ul>
        </section>

        <section className="hero-card" id="about">
          <h2>Hva er Forecast24?</h2>
          <p>
            Forecast24 er et personlig sideprosjekt for å utforske
            ende-til-ende data science i praksis: fra innsamling av
            strømprisdata, via modellering av tidsrekker, til et visuelt
            dashboard som kan brukes av faktiske brukere.
          </p>
          <p>
            Målet er å gi et intuitivt overblikk over når det er billigst og
            dyrest å bruke strøm det neste døgnet – og samtidig demonstrere
            ferdigheter innen dataanalyse, maskinlæring og webutvikling.
          </p>

          <div className="info-grid">
            <div className="info-item">
              <span className="label">Tidsrom</span>
              <span className="value">Neste 24 timer</span>
            </div>
            <div className="info-item">
              <span className="label">Område</span>
              <span className="value">Norge (spotpris)</span>
            </div>
            <div className="info-item">
              <span className="label">Stack</span>
              <span className="value">React · Vercel · (Python backend kommer)</span>
            </div>
            <div className="info-item">
              <span className="label">Status</span>
              <span className="value status-pill">MVP under utvikling</span>
            {forecastInfo && (
              <p className="api-status">
                API-status: <strong>{forecastInfo.status}</strong> – billigst rundt kl{" "}
                <strong>{forecastInfo.summary.cheapest_hour}:00</strong>, dyrest rundt kl{" "}
                <strong>{forecastInfo.summary.priciest_hour}:00</strong> (
                {forecastInfo.summary.min_price}–{forecastInfo.summary.max_price}{" "}
                {forecastInfo.summary.unit})
              </p>
            )}

            <section style={{ marginTop: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Dagens strømpris (NO1)</h3>
                <p style={{ margin: "0.2rem 0 0.8rem", fontSize: "0.8rem", color: "#9ca3af" }}>
                  Time-for-time spotpris for i dag. Data fra NVE / hvakosterstrommen.no.
                </p>
              <SpotPriceChart area="NO1" />
            </section>


            {forecastError && (
              <p className="api-status api-status--error">
                Klarte ikke å hente forecast-data: {forecastError}
              </p>
            )}
              
            </div>
          </div>
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

export default App;
