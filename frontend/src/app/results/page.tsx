"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { evaluateSession } from "../../lib/api"
import { SESSION_KEYS } from "../../lib/constants"
import { navigateTo } from "../../lib/navigation"
import { EvaluationResult } from "../../types/index"
import { RadarChart } from "../../components/RadarChart"
import { ResultsCard } from "../../components/ResultsCard"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"

interface EvaluationPayload {
  conversationHistory: string
  codeSnapshots: string[]
  timeElapsedSeconds: number
  curveballFired: boolean
  curveballAddressed: boolean
  studentName: string
}

function MetricCard({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? "#22c55e" :
    value >= 6 ? "#6366f1" :
    value >= 4 ? "#f59e0b" :
    "#ef4444"

  return (
    <Card className="border-white/10 bg-white/[0.035]">
      <CardContent className="p-4">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500">
          {label.toUpperCase()}
        </div>
        <div className="mt-3 text-4xl font-semibold tracking-[-0.06em]" style={{ color }}>
          {value}
          <span className="ml-1 text-base text-zinc-500">/10</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ResultsSkeleton() {
  const block = (height: number, width: string | number = "100%") => (
    <div
      style={{
        height,
        width: typeof width === "number" ? `${width}px` : width,
      }}
      className="animate-[skeletonPulse_1.4s_ease-in-out_infinite] rounded-2xl bg-[linear-gradient(90deg,#111,#1b1b1f,#111)] bg-[length:200%_100%]"
    />
  )

  return (
    <main className="min-h-screen px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <Loader2 size={16} className="animate-spin text-indigo-300" />
          Evaluator grading structured JSON...
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            {block(18, 300)}
            {block(56, 420)}
            {block(20, 520)}
          </div>
          {block(44, 140)}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          {block(430)}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {block(132)}
              {block(132)}
              {block(132)}
              {block(132)}
            </div>
            {block(180)}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {block(220)}
          {block(220)}
        </div>
      </div>
    </main>
  )
}

function fallbackResult(payload: EvaluationPayload): EvaluationResult {
  const optimized = payload.codeSnapshots.some((code) =>
    code.includes("merge") || code.includes("quick") || code.includes(".sort(")
  )

  return {
    technicalAccuracy: optimized ? 7 : 3,
    adaptability: payload.curveballFired ? (payload.curveballAddressed ? 8 : 4) : 5,
    communication: 5,
    efficiency: payload.timeElapsedSeconds < 360 ? 8 : 6,
    overallFeedback:
      "Evaluation service was unavailable, so the session used a conservative fallback score. The assessment flow was preserved, but the final scoring model could not complete its full analysis.",
    strengths: [
      "Completed the assessment flow",
      optimized ? "Moved toward a faster solution after the constraint changed" : "Engaged with the practical simulation",
    ],
    improvements: [
      "Re-run the assessment with the evaluation service online",
      "Add a stronger explanation of why the chosen approach fits the constraint",
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
          const parsed = JSON.parse(rawResult) as EvaluationResult
          if (!cancelled) setResult(parsed)
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
    return () => {
      cancelled = true
    }
  }, [])

  const passed = useMemo(() => Boolean(result?.passed), [result])
  const avgScore = useMemo(() => {
    if (!result) return "—"
    const average =
      (result.technicalAccuracy +
        result.adaptability +
        result.communication +
        result.efficiency) / 4
    return average.toFixed(1)
  }, [result])

  if (loading) return <ResultsSkeleton />

  if (missing || !result) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-zinc-100">
        <Card className="max-w-md border-white/10 bg-white/[0.035]">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">
              NO SESSION DATA
            </Badge>
            <CardTitle className="text-2xl">Assessment data not found</CardTitle>
            <p className="text-sm leading-6 text-zinc-400">
              Start a new assessment so the evaluator has a transcript and code snapshots to grade.
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigateTo("/")}>
              <ArrowLeft size={15} />
              Back to home
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-[0.18em] text-zinc-500">
              PRACTICAL ASSESSMENT REPORT
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              Session Results
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-400">
              A concise summary of technical accuracy, adaptability, communication, and execution speed.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge variant={passed ? "success" : "error"} className="px-4 py-2 text-xs">
              {passed ? <CheckCircle2 size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
              {passed ? "PASSED" : "NOT PASSED"}
            </Badge>
            <div className="text-xs text-zinc-500">Average score: {avgScore}/10</div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Score profile</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <RadarChart scores={result} />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Technical Accuracy" value={result.technicalAccuracy} />
            <MetricCard label="Adaptability" value={result.adaptability} />
            <MetricCard label="Communication" value={result.communication} />
            <MetricCard label="Efficiency" value={result.efficiency} />
          </div>
        </div>

        <Card className="border-white/10 bg-white/[0.035]">
          <CardHeader>
            <CardTitle className="text-xl">Overall feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-4xl text-sm leading-7 text-zinc-300">
              {result.overallFeedback}
            </p>
          </CardContent>
        </Card>

        <ResultsCard strengths={result.strengths} improvements={result.improvements} />

        <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-500">
            Clean, structured summary ready for a judge demo.
          </div>

          <Button onClick={() => navigateTo("/")}>
            <ArrowLeft size={15} />
            Retake assessment
          </Button>
        </div>
      </div>
    </main>
  )
}