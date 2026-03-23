# forecast24-frontend

Frontend for [Forecast24](https://forecast24.no) – a side project for predicting Norwegian electricity prices.
Built with **React** and **Vite**, hosted on [Vercel](https://vercel.com).

---

## Tech Stack

| Layer      | Technology   |
|------------|--------------|
| Framework  | React 18     |
| Build Tool | Vite         |
| Routing    | React Router |
| Charts     | Recharts     |
| HTTP       | Axios        |
| Hosting    | Vercel       |

---

## Pages

### `/` – Home
Landing page with information about the project, features, and tech stack.

### `/dashboard` – Dashboard
Interactive dashboard with:
- **Today's spot price** – hour-by-hour chart for the selected price zone
- **Last 30 days** – daily average over one month of historical data
- **KPI cards** – cheapest hour/day, most expensive hour/day, and average price
- Support for all Norwegian price zones: NO1–NO5

---

## Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/Sondreespe/forecast24-frontend.git
cd forecast24-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```
VITE_API_BASE=http://localhost:8000
```

### 4. Start the development server
```bash
npm run dev
```

The app is now available at `http://localhost:5173`.

---

## Project Structure

```
forecast24-frontend/
├── src/
│   ├── App.jsx                      # Routing
│   ├── main.jsx                     # Entry point
│   ├── api.js                       # API calls to backend
│   ├── pages/
│   │   ├── Home.jsx                 # Landing page
│   │   └── Dashboard.jsx            # Main dashboard
│   └── components/
│       └── SpotPriceChart.jsx       # Reusable price chart
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Environment Variables

| Variable        | Description           |
|-----------------|-----------------------|
| `VITE_API_BASE` | URL to the backend API |

In production, this is set to `https://forecast24-backend.onrender.com` via Vercel settings.

---

## Status

> **Under active development**
>
> Forecast functionality and ML-based predictions are planned as the next step.

---

## Related

- **Backend:** [forecast24-backend](https://github.com/Sondreespe/forecast24-backend)
- **Live app:** [forecast24.no](https://forecast24.no)

---

*Built by Sondre Espe*
