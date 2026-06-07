"use client"
import { ExamState } from "../types/index"

interface Props {
  examState: ExamState
  visible: boolean
}

export function ExamStateDebugPanel({ examState, visible }: Props) {
  if (!visible) return null

  const stateColor = (val: boolean) => val ? "#22c55e" : "#ef4444"

  return (
    <div style={{
      position: "fixed",
      bottom: "16px",
      left: "16px",
      background: "#0a0a0a",
      border: "1px solid #6366f1",
      borderRadius: "8px",
      padding: "12px 16px",
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#e4e4e4",
      zIndex: 9999,
      minWidth: "260px",
      lineHeight: "1.6",
      boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    }}>
      <div style={{ color: "#6366f1", fontWeight: "bold", marginBottom: "6px" }}>
        ◆ CAG State Struct (live)
      </div>
      <div>bugFixed: <span style={{ color: stateColor(examState.bugFixed) }}>{String(examState.bugFixed)}</span></div>
      <div>approach: <span style={{ color: "#f59e0b" }}>{examState.approach}</span></div>
      <div>intentClass: <span style={{ color: "#a78bfa" }}>{examState.lastIntentClass}</span></div>
      <div>codeState: <span style={{ color: "#f59e0b" }}>{examState.lastCodeState}</span></div>
      <div>curveballSeen: <span style={{ color: stateColor(examState.curveballSeen) }}>{String(examState.curveballSeen)}</span></div>
      <div>curveballAddressed: <span style={{ color: stateColor(examState.curveballAddressed) }}>{String(examState.curveballAddressed)}</span></div>
      <div>hintsGiven: <span style={{ color: "#93c5fd" }}>{examState.hintsGiven}</span></div>
      <div>turnsElapsed: <span style={{ color: "#93c5fd" }}>{examState.turnsElapsed}</span></div>
      <div style={{ marginTop: "6px", color: "#888", fontSize: "10px" }}>
        CAG key: {examState.lastIntentClass}:{examState.lastCodeState}:{String(examState.curveballSeen)}
      </div>
      <div style={{ color: "#888", fontSize: "10px" }}>
        Press ` to hide · Shift+D to fire curveball
      </div>
    </div>
  )
}
