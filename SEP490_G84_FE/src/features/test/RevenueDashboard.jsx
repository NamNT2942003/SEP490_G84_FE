import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const roomData = [
  { name: "Std Twin", revenue: 24552000, color: "#4f46e5" },
  { name: "Superior Double", revenue: 55584000, color: "#f59e0b" },
  { name: "Deluxe Double", revenue: 92644000, color: "#10b981" },
  { name: "Deluxe Twin", revenue: 128158000, color: "#ef4444" },
  { name: "Deluxe Triple", revenue: 183279000, color: "#8b5cf6" },
];

const totalRevenue = 484217000;
const occupancyRate = 95;
const avgPrice = 1061879;
const totalGuests = 1051;
const growthRate = 65.3;

const COLORS = ["#4f46e5", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #dbeafe",
          borderRadius: 12,
          padding: "10px 16px",
          color: "#1e293b",
          fontSize: 13,
          boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, color: "#4f46e5" }}>
          {label || payload[0]?.name}
        </p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: "4px 0 0", color: p.color || "#334155" }}>
            {fmt(p.value)} ₫
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ label, value, sub, color, icon }) => (
  <div
    style={{
      background: "#ffffff",
      border: `1px solid ${color}22`,
      borderRadius: 18,
      padding: "20px 24px",
      position: "relative",
      overflow: "hidden",
      flex: 1,
      minWidth: 180,
      boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: `${color}12`,
      }}
    />
    <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
    <div
      style={{
        fontSize: 11,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1 }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>
    )}
  </div>
);

export default function RevenueDashboard() {
  const [view, setView] = useState("chart");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef4ff 45%, #fefefe 100%)",
        fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif",
        color: "#1e293b",
        padding: "28px 20px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6366f1",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 4,
                fontWeight: 700,
              }}
            >
              Báo cáo tháng
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 900,
                background: "linear-gradient(90deg, #4f46e5, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: -0.5,
              }}
            >
              DOANH THU PHÒNG
            </h1>
          </div>

          {/* Toggle Buttons */}
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "#ffffffcc",
              borderRadius: 12,
              padding: 6,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            }}
          >
            {["chart", "detail"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  transition: "all 0.25s",
                  background:
                    view === v
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "transparent",
                  color: view === v ? "#fff" : "#64748b",
                  boxShadow: view === v ? "0 4px 12px rgba(99,102,241,0.25)" : "none",
                }}
              >
                {v === "chart" ? "📊 Biểu đồ" : "📋 Chi tiết"}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard icon="💰" label="Tổng doanh thu" value={`${fmt(totalRevenue)} ₫`} color="#4f46e5" />
          <StatCard icon="📈" label="So tháng trước" value={`+${growthRate}%`} color="#10b981" sub="Tăng trưởng" />
          <StatCard icon="🏨" label="Tỉ lệ lấp kín" value={`${occupancyRate}%`} color="#f59e0b" />
          <StatCard icon="💎" label="Giá TB/đêm" value={`${fmt(avgPrice)} ₫`} color="#d946ef" />
          <StatCard icon="👥" label="Tổng khách" value={fmt(totalGuests)} color="#ef4444" sub="lượt khách" />
        </div>

        {/* CHART VIEW */}
        {view === "chart" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Bar Chart */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: "24px 16px",
                boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 8px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#4f46e5",
                }}
              >
                Doanh thu theo loại phòng
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={roomData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {roomData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie + KPI */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: "24px 16px",
                  flex: 1,
                  minWidth: 280,
                  boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 8px",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#4f46e5",
                  }}
                >
                  Tỉ trọng doanh thu
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={roomData}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {roomData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${fmt(v)} ₫`} />
                    <Legend
                      formatter={(v) => (
                        <span style={{ color: "#64748b", fontSize: 12 }}>{v}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 240,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {roomData.map((r, i) => {
                  const pct = ((r.revenue / totalRevenue) * 100).toFixed(1);
                  return (
                    <div
                      key={i}
                      style={{
                        background: "#ffffff",
                        border: `1px solid ${COLORS[i]}22`,
                        borderRadius: 12,
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        boxShadow: "0 6px 20px rgba(15,23,42,0.04)",
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: COLORS[i],
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{r.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                          {fmt(r.revenue)} ₫
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: COLORS[i] }}>
                        {pct}%
                      </div>
                      <div
                        style={{
                          width: 60,
                          height: 4,
                          background: "#e2e8f0",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: COLORS[i],
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #f59e0b, #fb7185)",
                padding: "14px 20px",
                textAlign: "center",
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: 2,
                color: "#fff",
              }}
            >
              DOANH THU PHÒNG
            </div>

            <div style={{ padding: 20, overflowX: "auto" }}>
              <div
                style={{
                  color: "#f59e0b",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                Tổng doanh thu: {fmt(totalRevenue)}
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  minWidth: 700,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Std Twin",
                      "Superior Double",
                      "Deluxe Double",
                      "Deluxe Twin",
                      "Deluxe Triple",
                      "So sánh tháng trước (tăng/giảm %)",
                      "Tỉ lệ lấp kín phòng (%)",
                      "Trung bình giá phòng/đêm",
                      "Tổng số lượng khách trong tháng",
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "10px 14px",
                          background: i < 5 ? "#eef2ff" : "#f8fafc",
                          color: "#4f46e5",
                          fontWeight: 700,
                          border: "1px solid #e2e8f0",
                          textAlign: "center",
                          whiteSpace: i >= 5 ? "normal" : "nowrap",
                          lineHeight: 1.4,
                          fontSize: 12,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[24552000, 55584000, 92644000, 128158000, 183279000].map((v, i) => (
                      <td
                        key={i}
                        style={{
                          padding: "12px 14px",
                          background: "#fffbea",
                          border: "1px solid #e2e8f0",
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#b45309",
                          fontSize: 14,
                        }}
                      >
                        {fmt(v)}
                      </td>
                    ))}
                    <td
                      style={{
                        padding: "12px 14px",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#10b981",
                        fontSize: 14,
                        background: "#f0fdf4",
                      }}
                    >
                      ▲ Tăng {growthRate}%
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#f59e0b",
                        background: "#fff7ed",
                      }}
                    >
                      {occupancyRate}%
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                    >
                      {fmt(avgPrice)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                    >
                      {fmt(totalGuests)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 12,
                    fontWeight: 600,
                  }}
                >
                  Phân bổ doanh thu theo loại phòng
                </div>
                {roomData.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 110,
                        fontSize: 12,
                        color: "#64748b",
                        flexShrink: 0,
                      }}
                    >
                      {r.name}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: "#e2e8f0",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${((r.revenue / totalRevenue) * 100).toFixed(1)}%`,
                          height: "100%",
                          background: COLORS[i],
                          borderRadius: 4,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS[i],
                        fontWeight: 700,
                        width: 48,
                        textAlign: "right",
                      }}
                    >
                      {((r.revenue / totalRevenue) * 100).toFixed(1)}%
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        width: 120,
                        textAlign: "right",
                      }}
                    >
                      {fmt(r.revenue)} ₫
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          Dữ liệu cập nhật theo tháng • Tỉ lệ lấp kín: {occupancyRate}% • {fmt(totalGuests)} lượt khách
        </div>
      </div>
    </div>
  );
}