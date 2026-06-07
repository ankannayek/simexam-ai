"use client"

interface Props {
  strengths: string[]
  improvements: string[]
}

export function ResultsCard({ strengths, improvements }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
      <div style={{ background: "#0d1f16", border: "1px solid #14532d", borderRadius: "8px", padding: "16px" }}>
        <h3 style={{ color: "#22c55e", fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Strengths</h3>
        {strengths.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", color: "#e4e4e4", fontSize: "13px", lineHeight: "1.5" }}>
            <span style={{ color: "#22c55e", marginTop: "2px" }}>✓</span>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "#1c1208", border: "1px solid #92400e", borderRadius: "8px", padding: "16px" }}>
        <h3 style={{ color: "#f59e0b", fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Areas for Growth</h3>
        {improvements.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", color: "#e4e4e4", fontSize: "13px", lineHeight: "1.5" }}>
            <span style={{ color: "#f59e0b", marginTop: "2px" }}>→</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
