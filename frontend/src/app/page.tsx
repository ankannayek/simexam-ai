"use client"
import { useState } from "react"
import { ArrowRight, BrainCircuit, ShieldCheck, Workflow } from "lucide-react"
import { SESSION_KEYS } from "../lib/constants"
import { navigateTo } from "../lib/navigation"

export default function LandingPage() {
  const [name, setName] = useState("")
  function begin() {
    const clean = name.trim() || "Candidate"
    sessionStorage.setItem(SESSION_KEYS.STUDENT_NAME, clean)
    sessionStorage.removeItem(SESSION_KEYS.RESULTS)
    sessionStorage.removeItem(SESSION_KEYS.EVALUATION_PAYLOAD)
    sessionStorage.removeItem(SESSION_KEYS.EVALUATION_PENDING)
    navigateTo("/exam")
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0f0f",
      padding: "24px",
    }}>
      <section style={{ width: "100%", maxWidth: "920px", animation: "fadeInUp 0.6s ease-out" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid #3730a3",
            background: "rgba(99,102,241,0.08)",
            color: "#c7d2fe",
            borderRadius: "4px",
            padding: "5px 10px",
            fontSize: "11px",
            letterSpacing: "0.06em",
            fontWeight: 600,
            marginBottom: "16px",
          }}>
            FAR AWAY 2026 · EXAMINATIONS × AGENTIC SYSTEMS
          </div>
          <h1 style={{
            fontSize: "clamp(42px, 7vw, 72px)",
            lineHeight: 0.95,
            margin: "0 0 16px",
            letterSpacing: "-0.06em",
          }}>
            SimExam<span style={{ color: "#818cf8" }}>.ai</span>
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "17px", maxWidth: "640px", margin: "0 auto", lineHeight: 1.6 }}>
            A live, AI-refereed coding assessment where candidates debug, reason, adapt to a PM curveball, and get structured evaluation.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: "16px",
          alignItems: "stretch",
        }}>
          {/* Left card — begin assessment */}
          <div style={{
            border: "1px solid #27272a",
            background: "#111111",
            borderRadius: "8px",
            padding: "24px",
          }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>
              Begin practical assessment
            </h2>
            <p style={{ color: "#71717a", fontSize: "13px", lineHeight: 1.6, marginTop: "8px" }}>
              You will get a broken JavaScript sorting module, a senior-dev mentor chat, a mock terminal, and a timed production constraint update.
            </p>

            <label style={{ display: "block", color: "#a1a1aa", fontSize: "12px", fontWeight: 500, letterSpacing: "0.04em", margin: "20px 0 7px" }}>
              STUDENT NAME
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") begin() }}
              placeholder="Your name"
              autoFocus
              style={{
                width: "100%",
                background: "#0f0f0f",
                border: "1px solid #3f3f46",
                color: "#f4f4f5",
                borderRadius: "6px",
                padding: "12px 14px",
                outline: "none",
                fontSize: "14px",
                transition: "border-color 0.15s",
              }}
              onFocus={e => { e.target.style.borderColor = "#6366f1" }}
              onBlur={e => { e.target.style.borderColor = "#3f3f46" }}
            />
            <button
              onClick={begin}
              style={{
                width: "100%",
                marginTop: "14px",
                background: "#6366f1",
                border: "none",
                borderRadius: "6px",
                color: "white",
                padding: "13px 16px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#5254cc" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#6366f1" }}
            >
              Begin Assessment <ArrowRight size={16} />
            </button>

            <div style={{ marginTop: "16px", color: "#52525b", fontSize: "11px", fontFamily: "monospace" }}>
              Shift+D fires curveball · <code style={{ color: "#71717a" }}>`</code> shows agent state · Ctrl+Enter runs code
            </div>
          </div>

          {/* Right card — architecture */}
          <div style={{
            border: "1px solid #27272a",
            background: "#0a0a0a",
            borderRadius: "8px",
            padding: "20px",
          }}>
            <h3 style={{
              margin: "0 0 4px",
              color: "#a1a1aa",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}>
              ARCHITECTURE
            </h3>
            <p style={{ margin: "0 0 14px", color: "#71717a", fontSize: "12px" }}>
              Three agents, bounded state machine
            </p>
            {[
              [BrainCircuit, "Simulator", "Gemini streaming mentor. Intent classifier routes ~85% of turns to pre-authored CAG responses — only NOVEL_INPUT fires a live call."],
              [Workflow, "PM Curveball", "Autonomous timed event at 120s. Injects O(n log n) constraint. Zero LLM variance — fires from timer state, not model output."],
              [ShieldCheck, "Evaluator", "Single structured Gemini JSON call. Scores 4 dimensions. Rule-based fallback runs immediately if model rate-limits."],
            ].map(([Icon, title, copy]) => {
              const C = Icon as typeof BrainCircuit
              return (
                <div key={String(title)} style={{
                  display: "flex",
                  gap: "10px",
                  padding: "12px 0",
                  borderTop: "1px solid #1f1f1f",
                }}>
                  <div style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "6px",
                    background: "#111",
                    border: "1px solid #27272a",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}><C size={15} /></div>
                  <div>
                    <div style={{ color: "#e4e4e7", fontSize: "13px", fontWeight: 600 }}>{title as string}</div>
                    <div style={{ color: "#71717a", fontSize: "11px", lineHeight: 1.5, marginTop: "2px" }}>{copy as string}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom strip — CAG key explainer */}
        <div style={{
          marginTop: "16px",
          border: "1px solid #1f1f1f",
          background: "#0a0a0a",
          borderRadius: "6px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          <span style={{ color: "#52525b", fontSize: "11px", fontFamily: "monospace", flexShrink: 0 }}>
            Production CAG key:
          </span>
          {[
            ["HINT_REQUEST:BUGGY_ORIGINAL:false", "#3730a3", "#c7d2fe"],
            ["CODE_PASTE:FIXED_FAST:true", "#14532d", "#86efac"],
            ["NOVEL_INPUT:*:*", "#451a03", "#fcd34d"],
          ].map(([key, bg, fg]) => (
            <code key={key} style={{
              background: bg,
              color: fg,
              fontSize: "10px",
              padding: "2px 7px",
              borderRadius: "3px",
              fontFamily: "monospace",
            }}>
              {key}
            </code>
          ))}
          <span style={{ color: "#52525b", fontSize: "11px", marginLeft: "auto" }}>
            ~85% served from KV store · ~15% → live Gemini
          </span>
        </div>
      </section>
    </main>
  )
}
