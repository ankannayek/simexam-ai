"use client"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { ChatMessage } from "../types/index"
import { CurveballBanner } from "./CurveballBanner"
import { TypingIndicator } from "./TypingIndicator"

interface Props {
  messages: ChatMessage[]
  isTyping: boolean
  onSendMessage: (text: string) => void
  disabled?: boolean
}

export function ChatPanel({ messages, isTyping, onSendMessage, disabled }: Props) {
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  function handleSend() {
    const text = input.trim()
    if (!text || disabled || isTyping) return
    setInput("")
    onSendMessage(text)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#141414" }}>
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid #2a2a2a",
        background: "#111",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
        <span style={{ color: "#e4e4e4", fontSize: "13px", fontWeight: "600" }}>Alex Chen — Senior Dev</span>
        <span style={{
          marginLeft: "auto",
          color: "#888",
          fontSize: "11px",
          background: "#1f1f1f",
          padding: "2px 8px",
          borderRadius: "4px",
          border: "1px solid #2a2a2a",
        }}>
          Simulator Agent
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        {messages.map(msg => {
          if (msg.role === "pm") {
            return <CurveballBanner key={msg.id} message={msg.content} timestamp={msg.timestamp} />
          }

          const isStudent = msg.role === "student"
          return (
            <div key={msg.id} style={{
              display: "flex",
              flexDirection: isStudent ? "row-reverse" : "row",
              gap: "8px",
              alignItems: "flex-start",
            }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: isStudent ? "#374151" : "#1e1b4b",
                border: `1px solid ${isStudent ? "#4b5563" : "#4338ca"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: isStudent ? "#9ca3af" : "#a5b4fc",
                flexShrink: 0,
                fontWeight: "700",
              }}>
                {isStudent ? "ME" : "AC"}
              </div>

              <div style={{
                maxWidth: "82%",
                background: isStudent ? "#1f2937" : "#1a1a2e",
                border: `1px solid ${isStudent ? "#374151" : "#312e81"}`,
                borderRadius: isStudent ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                padding: "8px 12px",
              }}>
                <p style={{
                  color: msg.isError ? "#ef4444" : "#e4e4e4",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                  {msg.streaming && (
                    <span style={{
                      display: "inline-block",
                      width: "2px",
                      height: "14px",
                      background: "#6366f1",
                      marginLeft: "2px",
                      animation: "cursorBlink 0.8s step-start infinite",
                      verticalAlign: "text-bottom",
                    }} />
                  )}
                </p>
              </div>
            </div>
          )
        })}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #2a2a2a", display: "flex", gap: "8px" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Exam ended" : "Ask Alex a question... (Enter to send)"}
          disabled={disabled || isTyping}
          rows={2}
          style={{
            flex: 1,
            background: "#1f1f1f",
            border: "1px solid #2a2a2a",
            borderRadius: "6px",
            color: "#e4e4e4",
            fontSize: "13px",
            padding: "8px 12px",
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled || isTyping}
          style={{
            background: "#6366f1",
            border: "none",
            borderRadius: "6px",
            color: "#fff",
            padding: "0 14px",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer",
            opacity: (!input.trim() || disabled || isTyping) ? 0.4 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
