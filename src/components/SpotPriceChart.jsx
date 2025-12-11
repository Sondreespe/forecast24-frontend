import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchSpotPrices } from "../api";

export function SpotPriceChart({ area = "NO1" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);   // starter som true
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchSpotPrices(area);
        if (cancelled) return;

        const mapped = res.data.map((item) => ({
          time: new Date(item.time_start).toLocaleTimeString("nb-NO", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          nokPerKwh: item.NOK_per_kWh,
        }));

        setData(mapped);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Ukjent feil");
      } finally {
        if (!cancelled) {
          setLoading(false);   // vi setter bare til false når vi er ferdig
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [area]);

  if (loading) {
    return (
      <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        Laster strømpriser…
      </p>
    );
  }

  if (error) {
    return (
      <p style={{ fontSize: "0.85rem", color: "#f97373" }}>
        Klarte ikke å hente strømpriser: {error}
      </p>
    );
  }

  if (!data.length) {
    return (
      <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        Ingen data tilgjengelig for dette området.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 5, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            width={50}
            tickFormatter={(v) => `${v.toFixed(2)}`}
          />
          <Tooltip
            formatter={(value) => [`${value.toFixed(3)} kr/kWh`, "Pris"]}
            labelFormatter={(label) => `Kl. ${label}`}
            contentStyle={{
              background: "#020617",
              border: "1px solid #1f2937",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
            }}
          />
          <Line
            type="monotone"
            dataKey="nokPerKwh"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.4rem" }}>
        Dagens spotpris i {area} (NOK/kWh).
      </p>
    </div>
  );
}
