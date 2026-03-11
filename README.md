# forecast24-frontend

Frontend for [Forecast24](https://forecast24.no) – et sideprosjekt for prediksjon av norske strømpriser.

Bygget med **React** og **Vite**, hostet på [Vercel](https://vercel.com).

---

## Tech Stack

| Lag | Teknologi |
|---|---|
| Rammeverk | React 18 |
| Byggverktøy | Vite |
| Routing | React Router |
| Graf | Recharts |
| HTTP | Axios |
| Hosting | Vercel |

---

## Sider

### `/` – Hjemmeside
Landingsside med informasjon om prosjektet, funksjoner og teknisk stack.

### `/dashboard` – Dashboard
Interaktivt dashboard med:
- **Dagens spotpris** – time-for-time graf for valgt prisområde
- **Siste 30 dager** – daglig snitt over en måneds historikk
- **KPI-kort** – billigste time/dag, dyreste time/dag og snittpris
- Støtte for alle norske prisområder: NO1–NO5

---

## Lokal kjøring

### 1. Klon repoet
```bash
git clone https://github.com/Sondreespe/forecast24-frontend.git
cd forecast24-frontend
```

### 2. Installer avhengigheter
```bash
npm install
```

### 3. Konfigurer miljøvariabler
Opprett en `.env`-fil i rotmappen:
```
VITE_API_BASE=http://localhost:8000
```

### 4. Start utviklingsserveren
```bash
npm run dev
```

Appen er nå tilgjengelig på `http://localhost:5173`.

---

## Prosjektstruktur

```
forecast24-frontend/
├── src/
│   ├── App.jsx                      # Routing
│   ├── main.jsx                     # Inngangspunkt
│   ├── api.js                       # API-kall mot backend
│   ├── pages/
│   │   ├── Home.jsx                 # Landingsside
│   │   └── Dashboard.jsx            # Hoveddashboard
│   └── components/
│       └── SpotPriceChart.jsx       # Gjenbrukbar prisgraf
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Miljøvariabler

| Variabel | Beskrivelse |
|---|---|
| `VITE_API_BASE` | URL til backend-APIet |

I produksjon settes denne til `https://forecast24-backend.onrender.com` via Vercel-innstillingene.

---

## Status

>  **Under aktiv utvikling**
>
> Forecast-funksjonalitet og ML-basert prognose er planlagt som neste steg.

---

## Relatert

- **Backend:** [forecast24-backend](https://github.com/Sondreespe/forecast24-backend)
- **Live app:** [forecast24.no](https://forecast24.no)

---

*Built by Sondre Espe*