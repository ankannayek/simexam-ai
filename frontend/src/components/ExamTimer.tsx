"use client"
import { formatTime } from "../lib/utils"

interface Props {
  secondsLeft: number
  studentName: string
  examTitle?: string
}

export function ExamTimer({ secondsLeft, studentName, examTitle = "Production Sort Assessment" }: Props) {
  const isWarning = secondsLeft <= 120
  const isDanger = secondsLeft <= 30

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#111",
      borderBottom: "1px solid #2a2a2a",
      padding: "10px 20px",
      height: "52px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          background: "#6366f1",
          color: "#fff",
          fontSize: "11px",
          fontWeight: "700",
          padding: "2px 8px",
          borderRadius: "4px",
          letterSpacing: "0.05em",
        }}>
          SIMEXAM.AI
        </span>
        <span style={{ color: "#888", fontSize: "13px" }}>{examTitle}</span>
      </div>

      <div style={{
        fontFamily: "monospace",
        fontSize: "20px",
        fontWeight: "700",
        color: isDanger ? "#ef4444" : isWarning ? "#f59e0b" : "#e4e4e4",
        transition: "color 0.3s",
        minWidth: "60px",
        textAlign: "center",
      }}>
        {formatTime(secondsLeft)}
      </div>

      <div style={{ color: "#888", fontSize: "12px" }}>{studentName}</div>
    </div>
  )
}
