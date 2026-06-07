"use client"
import { AlertTriangle } from "lucide-react"
import { useEffect, useRef } from "react"

interface Props {
  message: string
  timestamp: number
}

export function CurveballBanner({ message }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [])

  return (
    <div
      ref={ref}
      style={{
        borderLeft: "4px solid #f97316",
        background: "#1c1208",
        borderRadius: "0 6px 6px 0",
        padding: "12px 14px",
        margin: "8px 0",
        animation: "curveballPulse 0.8s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <AlertTriangle size={14} color="#f97316" />
        <span style={{ color: "#f97316", fontWeight: "600", fontSize: "12px" }}>Alex (PM)</span>
        <span style={{
          background: "#f97316",
          color: "#fff",
          fontSize: "10px",
          padding: "1px 6px",
          borderRadius: "4px",
          fontWeight: "600",
        }}>
          CONSTRAINT UPDATE
        </span>
      </div>
      <p style={{ color: "#e4e4e4", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
        {message}
      </p>
    </div>
  )
}
