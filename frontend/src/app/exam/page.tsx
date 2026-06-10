"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react"
import { useParams } from "react-router-dom"
import { ChatPanel } from "../../components/ChatPanel"
import { CodeEditor } from "../../components/CodeEditor"
import { CurveballBanner } from "../../components/CurveballBanner"
import { ExamStateDebugPanel } from "../../components/ExamStateDebugPanel"
import { ExamTimer } from "../../components/ExamTimer"
import { RealTerminal } from "../../components/RealTerminal"
import { RichTextEditor } from "../../components/RichTextEditor"
import { WhiteboardCanvas } from "../../components/WhiteboardCanvas"
import { AgentStatusBar } from "../../components/AgentStatusBar"
import { TenantShell } from "../../components/TenantShell"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import {
  CURVEBALL_MESSAGE,
  INITIAL_CODE,
  SESSION_KEYS,
} from "../../lib/constants"
import { navigateTo } from "../../lib/navigation"
import { classifyIntent } from "../../lib/codeAnalysis"
import { useChat } from "../../hooks/useChat"
import { useExamState } from "../../hooks/useExamState"
import { useExamTimer } from "../../hooks/useExamTimer"
import { useTerminal } from "../../hooks/useTerminal"
import { useTenantConfig } from "../../hooks/useTenantConfig"
import { useAgentStatus } from "../../hooks/useAgentStatus"

export default function ExamPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const tenant = useTenantConfig(orgSlug || "demo")

  const [studentName] = useState(() => {
    if (typeof window === "undefined") return "Candidate"
    return sessionStorage.getItem(SESSION_KEYS.STUDENT_NAME) || "Candidate"
  })

  const [code, setCode] = useState(() => {
    if (typeof window === "undefined") return tenant.config?.exam.starterCode || INITIAL_CODE
    return sessionStorage.getItem(SESSION_KEYS.CODE) || tenant.config?.exam.starterCode || INITIAL_CODE
  })

  // Update initial code when tenant config loads if not in storage
  useEffect(() => {
    if (tenant.config && !sessionStorage.getItem(SESSION_KEYS.CODE)) {
      setCode(tenant.config.exam.starterCode)
    }
  }, [tenant.config])

  const [draft, setDraft] = useState("")
  const [debugVisible, setDebugVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const chat = useChat(studentName, orgSlug)
  const terminal = useTerminal()
  const examState = useExamState()
  const agentStatus = useAgentStatus()

  const { secondsLeft, curveballFired, formattedTime } = useExamTimer({
    initialDuration: tenant.config?.exam.timeLimitSeconds || 3600,
    curveballAt: tenant.config?.exam.curveballAtSeconds || 1800,
    onCurveball: () => {
      chat.injectCurveball()
      examState.markCurveballSeen()
    },
    onExpire: () => {
      void submitAssessment(true)
    },
  })

  useEffect(() => {
    if (!studentName || studentName === "Candidate") {
      navigateTo("/")
    }
  }, [studentName])

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEYS.CODE, code)
  }, [code])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return
      }

      if (event.key === "`") {
        setDebugVisible((prev) => !prev)
      }

      if (event.shiftKey && event.key.toLowerCase() === "d" && !curveballFired) {
        chat.injectCurveball()
        examState.markCurveballSeen()
      }

      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault()
        runCurrentCode()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [curveballFired, chat, code])

  const sessionStatus = useMemo(() => {
    if (secondsLeft <= 30) return "critical"
    if (secondsLeft <= 120) return "warning"
    return "stable"
  }, [secondsLeft])

  function runCurrentCode() {
    agentStatus.setStatus("running")
    terminal.executeCode(code).finally(() => agentStatus.setStatus("idle"))
    chat.recordCodeSnapshot(code)
    examState.updateFromCode(code, chat.curveballFired)
    examState.registerInteraction(classifyIntent(code))
  }

  async function handleSend() {
    const trimmed = draft.trim()
    if (!trimmed || chat.isTyping) return

    const intent = classifyIntent(trimmed)
    examState.registerInteraction(intent)
    chat.recordCodeSnapshot(code)
    
    agentStatus.setStatus("thinking")
    await chat.sendMessage(trimmed, examState.examState, code)
    agentStatus.setStatus("idle")
    
    examState.updateFromCode(code, chat.curveballFired)
    setDraft("")
  }

  function resetSession() {
    sessionStorage.removeItem(SESSION_KEYS.STUDENT_NAME)
    sessionStorage.removeItem(SESSION_KEYS.EXAM_STATE)
    sessionStorage.removeItem(SESSION_KEYS.MESSAGES)
    sessionStorage.removeItem(SESSION_KEYS.CODE)
    sessionStorage.removeItem(SESSION_KEYS.TIMER)
    sessionStorage.removeItem(SESSION_KEYS.RESULTS)
    sessionStorage.removeItem(SESSION_KEYS.EVALUATION_PAYLOAD)
    sessionStorage.removeItem(SESSION_KEYS.EVALUATION_PENDING)
    navigateTo("/")
  }

  async function submitAssessment(auto = false) {
    if (submitting) return
    setSubmitting(true)

    const payload = {
      conversationHistory: chat.buildTranscript(),
      codeSnapshots: chat.codeSnapshots.length > 0 ? chat.codeSnapshots : [code],
      timeElapsedSeconds: Math.max(0, (tenant.config?.exam.timeLimitSeconds || 3600) - secondsLeft),
      curveballFired: chat.curveballFired,
      curveballAddressed: examState.examState.curveballAddressed,
      studentName,
      orgSlug,
      finalCode: code
    }

    sessionStorage.setItem(SESSION_KEYS.EVALUATION_PAYLOAD, JSON.stringify(payload))
    sessionStorage.setItem(SESSION_KEYS.EVALUATION_PENDING, "true")
    sessionStorage.removeItem(SESSION_KEYS.RESULTS)

    if (auto) {
      navigateTo("/results")
      return
    }

    navigateTo("/results")
  }

  return (
    <TenantShell orgSlug={orgSlug || "demo"}>
      <main className="min-h-screen px-4 py-4 text-zinc-100 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 lg:gap-5">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={sessionStatus === "critical" ? "error" : sessionStatus === "warning" ? "warning" : "outline"}>
                      LIVE SESSION
                    </Badge>
                    <span className="text-xs text-zinc-500">clean interface • high signal • no clutter</span>
                  </div>

                  <h1 className="text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
                    {tenant.config?.exam.title || "Production Sort Assessment"}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-zinc-400 whitespace-pre-wrap">
                    {tenant.config?.exam.problemStatement || "Debug the module, ask the interviewer for clarity, and adapt when the requirement changes."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="ghost" onClick={resetSession}>
                    <ArrowLeft size={15} />
                    Exit
                  </Button>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-zinc-400">
                    Press <span className="text-zinc-200">`</span> for debug
                  </div>
                  {(!tenant.config?.exam.type || tenant.config.exam.type === "coding") && (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-zinc-400">
                      <span className="text-zinc-200">Ctrl</span> + <span className="text-zinc-200">Enter</span> runs code
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ExamTimer
                  secondsLeft={secondsLeft}
                  studentName={studentName}
                  curveballFired={chat.curveballFired}
                />
                <AgentStatusBar status={agentStatus.status} />
              </div>
            </CardContent>
          </Card>

          {chat.curveballFired ? <CurveballBanner message={tenant.config?.exam.curveballMessage || CURVEBALL_MESSAGE} /> : null}

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-5">
            {(!tenant.config?.exam.type || tenant.config.exam.type === "coding") && (
              <CodeEditor
                code={code}
                onChange={setCode}
                onRun={runCurrentCode}
                onSubmit={() => void submitAssessment(false)}
              />
            )}

            {tenant.config?.exam.type === "conceptual" && (
              <RichTextEditor
                value={code}
                onChange={setCode}
              />
            )}

            {tenant.config?.exam.type === "system_design" && (
              <WhiteboardCanvas
                value={code}
                onChange={setCode}
              />
            )}

            <ChatPanel
              studentName={studentName}
              messages={chat.messages}
              draft={draft}
              onDraftChange={setDraft}
              onSend={() => void handleSend()}
              isTyping={chat.isTyping}
            />
          </div>

          {(!tenant.config?.exam.type || tenant.config.exam.type === "coding") && (
            <RealTerminal outputs={terminal.outputs} onClear={terminal.clearTerminal} />
          )}

          <div className="flex flex-col gap-3 rounded-3xl border border-white/8 bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-zinc-400">
              <div className="font-medium text-zinc-200">Session controls</div>
              <div>Run the code, keep the conversation moving, and submit when the solution is ready.</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(!tenant.config?.exam.type || tenant.config.exam.type === "coding") && (
                <Button variant="outline" onClick={runCurrentCode}>
                  <ShieldCheck size={15} />
                  Run code
                </Button>
              )}
              <Button onClick={() => void submitAssessment(false)} disabled={submitting}>
                <RotateCcw size={15} />
                Submit assessment
              </Button>
            </div>
          </div>
        </div>

        <ExamStateDebugPanel examState={examState.examState} visible={debugVisible} />
      </main>
    </TenantShell>
  )
}