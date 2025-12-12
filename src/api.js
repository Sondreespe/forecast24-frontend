import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

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