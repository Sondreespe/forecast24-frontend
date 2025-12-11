const API_BASE_URL = "https://forecast24-backend.onrender.com";

export async function fetchForecast() {
  const res = await fetch(`${API_BASE_URL}/forecast`);
  if (!res.ok) {
    throw new Error("Kunne ikke hente forecast");
  }
  return res.json();
}

export async function fetchSpotPrices(area = "NO1") {
  const res = await fetch(`${API_BASE_URL}/spotprices?area=${area}`);
  if (!res.ok) {
    throw new Error("Kunne ikke hente spotpriser");
  }
  return res.json(); // { area, data: [...] }
}
