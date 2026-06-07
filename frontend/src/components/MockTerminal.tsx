"use client"
import { TerminalOutput } from "../types/index"

interface Props {
  outputs: TerminalOutput[]
}

const STATUS_COLORS = {
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  idle: "#6366f1",
}

export function MockTerminal({ outputs }: Props) {
  return (
    <div style={{
      background: "#0a0a0a",
      borderTop: "1px solid #2a2a2a",
      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
      fontSize: "12px",
      color: "#e4e4e4",
      height: "160px",
      overflowY: "auto",
      padding: "10px 16px",
    }}>
      <div style={{ color: "#6366f1", marginBottom: "6px", fontWeight: "bold" }}>◆ SimExam Terminal</div>
      {outputs.map((output, i) => (
        <div key={i} style={{ marginBottom: "8px" }}>
          <div style={{ color: "#555", fontSize: "10px", marginBottom: "2px" }}>[{output.timestamp}]</div>
          {output.lines.map((line, j) => (
            <div
              key={j}
              style={{
                color: line.startsWith("✓") ? "#22c55e"
                  : line.startsWith("✗") || line.includes("Error") || line.includes("FAILED") ? "#ef4444"
                  : line.startsWith("⚠") || line.includes("Warning") ? "#f59e0b"
                  : line.startsWith("$") ? STATUS_COLORS[output.status]
                  : "#e4e4e4",
                lineHeight: "1.5",
              }}
            >
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
