console.log("VITE_API_BASE =", import.meta.env.VITE_API_BASE);

import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error("VITE_API_BASE mangler. Sett den i Render for frontend.");
}

export function fetchSpotPrices(area) {
  return axios.get(`${API_BASE}/api/spotprices`, { params: { area } });
}

export function fetchSpotPricesHistory(area, start, end) {
  return axios.get(`${API_BASE}/api/spotprices/history`, {
    params: { area, start, end, limit: 5000 },
  });
}

export function fetchForecast() {
  return axios.get(`${API_BASE}/api/forecast`);
}

console.log("VITE_API_BASE =", import.meta.env.VITE_API_BASE);