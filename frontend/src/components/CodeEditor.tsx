"use client"
import { useRef, useEffect } from "react"

interface Props {
  value: string
  onChange: (v: string) => void
  onRun: () => void
  onCopy?: () => void
  disabled?: boolean
}

export function CodeEditor({ value, onChange, onRun, onCopy, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        if (!disabled) onRun()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onRun, disabled])

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "#1a1a1a",
      borderRight: "1px solid #2a2a2a",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px",
        borderBottom: "1px solid #2a2a2a",
        background: "#141414",
      }}>
        <span style={{ color: "#888", fontSize: "12px", fontFamily: "monospace" }}>production-sort.js</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCopy} style={{
            background: "transparent",
            border: "1px solid #333",
            color: "#888",
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            cursor: "pointer",
          }}>
            Copy
          </button>
          <button onClick={onRun} disabled={disabled} style={{
            background: "#6366f1",
            border: "none",
            color: "#fff",
            padding: "3px 12px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}>
            Run → (Ctrl+↵)
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            background: "#1a1a1a",
            color: "#e4e4e4",
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize: "13px",
            lineHeight: "1.6",
            padding: "14px 16px",
            border: "none",
            outline: "none",
            resize: "none",
            tabSize: 2,
            opacity: disabled ? 0.65 : 1,
          }}
        />
      </div>
    </div>
  )
}
