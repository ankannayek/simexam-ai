"use client"
import { useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { RadarChart } from "../../components/RadarChart"
import { ResultsCard } from "../../components/ResultsCard"
import { evaluateSession } from "../../lib/api"
import { SESSION_KEYS } from "../../lib/constants"
import { navigateTo } from "../../lib/navigation"
import { EvaluationResult } from "../../types/index"

interface EvaluationPayload {
  conversationHistory: string
  codeSnapshots: string[]
  timeElapsedSeconds: number
  curveballFired: boolean
  curveballAddressed: boolean
  studentName: string
}

function MetricCard({ label, value }: { label: string; value: number }) {
  const color = value >= 8 ? "#22c55e" : value >= 6 ? "#6366f1" : value >= 4 ? "#f59e0b" : "#ef4444"
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: "6px", padding: "14px" }}>
      <div style={{ color: "#52525b", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "8px" }}>
        {label.toUpperCase()}
      </div>
      <div style={{ color, fontSize: "28px", fontWeight: 800, letterSpacing: "-0.04em" }}>
        {value}
        <span style={{ color: "#3f3f46", fontSize: "14px", fontWeight: 400 }}>/10</span>
      </div>
    </div>
  )
}

function ResultsSkeleton() {
  const block = (height: number, width = "100%") => (
    <div style={{
      height,
      width,
      borderRadius: "6px",
      background: "linear-gradient(90deg, #111, #1a1a1a, #111)",
      backgroundSize: "200% 100%",
      animation: "skeletonPulse 1.4s ease-in-out infinite",
    }} />
  )

  return (
    <main style={{ minHeight: "100vh", background: "#0f0f0f", padding: "32px 18px" }}>
      <section style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#6366f1", marginBottom: "24px", fontSize: "13px" }}>
          <Loader2 size={16} className="animate-spin" />
          Evaluator agent grading structured JSON...
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ width: "54%" }}>{block(52)}</div>
          <div style={{ width: "110px" }}>{block(32)}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.05fr) 0.95fr", gap: "16px" }}>
          {block(360)}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {block(72)}{block(72)}{block(72)}{block(72)}
            </div>
            {block(130)}
          </div>
        </div>
        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {block(140)}{block(140)}
        </div>
      </section>
    </main>
  )
}

function fallbackResult(payload: EvaluationPayload): EvaluationResult {
  return {
    technicalAccuracy: 3,
    adaptability: payload.curveballFired ? 3 : 5,
    communication: 5,
    efficiency: 4,
    overallFeedback: "Evaluation service was unavailable. The session was preserved, but grading fell back to a conservative default result.",
    strengths: ["Completed the assessment flow", "Interacted with the practical simulation"],
    improvements: [
      "Retry with the backend running and GEMINI_API_KEY configured",
      "Run the code before submitting to collect stronger evidence",
    ],
    passed: false,
  }
}

export default function ResultsPage() {
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadOrEvaluate() {
      const rawResult = sessionStorage.getItem(SESSION_KEYS.RESULTS)
      if (rawResult) {
        try {
          if (!cancelled) setResult(JSON.parse(rawResult) as EvaluationResult)
        } catch {
          sessionStorage.removeItem(SESSION_KEYS.RESULTS)
        } finally {
          if (!cancelled) setLoading(false)
        }
        return
      }

      const rawPayload = sessionStorage.getItem(SESSION_KEYS.EVALUATION_PAYLOAD)
      if (!rawPayload) {
        if (!cancelled) {
          setMissing(true)
          setLoading(false)
        }
        return
      }

      try {
        const payload = JSON.parse(rawPayload) as EvaluationPayload
        const evaluated = await evaluateSession(payload)
        sessionStorage.setItem(SESSION_KEYS.RESULTS, JSON.stringify(evaluated))
        sessionStorage.removeItem(SESSION_KEYS.EVALUATION_PENDING)
        if (!cancelled) setResult(evaluated)
      } catch {
        const payload = JSON.parse(rawPayload) as EvaluationPayload
        const fallback = fallbackResult(payload)
        sessionStorage.setItem(SESSION_KEYS.RESULTS, JSON.stringify(fallback))
        sessionStorage.removeItem(SESSION_KEYS.EVALUATION_PENDING)
        if (!cancelled) setResult(fallback)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadOrEvaluate()
    return () => { cancelled = true }
  }, [])

  if (loading) return <ResultsSkeleton />

  if (missing || !result) {
    return (
      <main style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f0f",
        color: "#e4e4e4",
      }}>
        <div style={{
          textAlign: "center",
          border: "1px solid #27272a",
          background: "#111",
          borderRadius: "8px",
          padding: "28px",
          maxWidth: "440px",
        }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "20px" }}>Assessment data not found</h1>
          <p style={{ color: "#71717a", lineHeight: 1.6, fontSize: "13px" }}>
            Start a new assessment so the evaluator has a transcript and code snapshots to grade.
          </p>
          <button
            onClick={() => navigateTo("/")}
            style={{
              marginTop: "14px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px 16px",
              fontWeight: 500,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Start Assessment
          </button>
        </div>
      </main>
    )
  }

  const passed = result.passed
  const avgScore = ((result.technicalAccuracy + result.adaptability + result.communication + result.efficiency) / 4).toFixed(1)

  return (
    <main style={{
      height: "100vh",
      overflowY: "auto",
      background: "#0f0f0f",
      padding: "32px 18px",
    }}>
      <section style={{ maxWidth: "980px", margin: "0 auto", animation: "fadeInUp 0.45s ease-out" }}>

        {/* Header row */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "20px",
        }}>
          <div>
            <div style={{
              color: "#52525b",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              marginBottom: "6px",
            }}>
              SIMEXAM.AI · PRACTICAL ASSESSMENT REPORT
            </div>
            <h1 style={{
              margin: 0,
              fontSize: "36px",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}>
              Session Results
            </h1>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              color: passed ? "#86efac" : "#fca5a5",
              border: `1px solid ${passed ? "#166534" : "#7f1d1d"}`,
              background: passed ? "#052e16" : "#450a0a",
              borderRadius: "4px",
              padding: "7px 12px",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.04em",
            }}>
              {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {passed ? "PASSED" : "NOT PASSED"}
            </div>
            <div style={{ color: "#52525b", fontSize: "11px", fontFamily: "monospace" }}>
              avg {avgScore}/10
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.05fr) 0.95fr", gap: "16px" }}>
          {/* Radar */}
          <div style={{
            background: "#0a0a0a",
            border: "1px solid #1f1f1f",
            borderRadius: "8px",
            padding: "16px",
          }}>
            <div style={{ color: "#52525b", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "12px" }}>
              SCORE PROFILE
            </div>
            <RadarChart scores={result} />
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <MetricCard label="Technical Accuracy" value={result.technicalAccuracy} />
              <MetricCard label="Adaptability" value={result.adaptability} />
              <MetricCard label="Communication" value={result.communication} />
              <MetricCard label="Efficiency" value={result.efficiency} />
            </div>

            <div style={{
              background: "#0a0a0a",
              border: "1px solid #1f1f1f",
              borderRadius: "6px",
              padding: "14px",
              flex: 1,
            }}>
              <div style={{
                color: "#52525b",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                marginBottom: "10px",
              }}>
                OVERALL FEEDBACK
              </div>
              <p style={{ color: "#a1a1aa", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
                {result.overallFeedback}
              </p>
            </div>
          </div>
        </div>

        {/* Strengths / Improvements */}
        <div style={{ marginTop: "16px" }}>
          <ResultsCard strengths={result.strengths} improvements={result.improvements} />
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          borderTop: "1px solid #1f1f1f",
          marginTop: "20px",
          paddingTop: "16px",
        }}>
          <span style={{ color: "#3f3f46", fontSize: "11px", fontFamily: "monospace" }}>
            FAR AWAY 2026 · CAG-ready multi-agent exam system · gemini-2.0-flash
          </span>
          <button
            onClick={() => navigateTo("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "9px 14px",
              fontWeight: 500,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> Retake Assessment
          </button>
        </div>
      </section>
    </main>
  )
}
