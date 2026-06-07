"use client"

export function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 0" }}>
      <span style={{ fontSize: "11px", color: "#888" }}>Alex is typing</span>
      <span style={{ display: "flex", gap: "3px" }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#6366f1",
              display: "inline-block",
              animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </span>
    </div>
  )
}
