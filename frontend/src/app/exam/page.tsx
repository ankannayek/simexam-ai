"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { ChatPanel } from "../../components/ChatPanel"
import { CodeEditor } from "../../components/CodeEditor"
import { ExamStateDebugPanel } from "../../components/ExamStateDebugPanel"
import { ExamTimer } from "../../components/ExamTimer"
import { MockTerminal } from "../../components/MockTerminal"
import { useChat } from "../../hooks/useChat"
import { useExamState } from "../../hooks/useExamState"
import { useExamTimer } from "../../hooks/useExamTimer"
import { useTerminal } from "../../hooks/useTerminal"
import { EXAM_DURATION_SECONDS, INITIAL_CODE, SESSION_KEYS } from "../../lib/constants"
import { classifyIntent, deriveApproach, deriveCodeState, isFastCustomSort } from "../../lib/codeAnalysis"
import { navigateTo } from "../../lib/navigation"

export default function ExamPage() {
  const [studentName, setStudentName] = useState("Candidate")
  const [code, setCode] = useState(INITIAL_CODE)
  const [debugVisible, setDebugVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submitRef = useRef(false)
  const timerSnapshotRef = useRef({ secondsLeft: EXAM_DURATION_SECONDS, curveballFired: false })

  const chat = useChat(studentName)
  const terminal = useTerminal()
  const exam = useExamState()

  const handleSubmit = useCallback((reason: "manual" | "timeout") => {
    if (submitRef.current) return
    submitRef.current = true
    setSubmitting(true)

    const timerSnapshot = timerSnapshotRef.current
    const finalCodeState = deriveCodeState(code)
    const finalCurveballAddressed = timerSnapshot.curveballFired && finalCodeState === "FIXED_FAST" && isFastCustomSort(code)

    chat.addCodeSnapshot(code)
    exam.updateFromCode(code, timerSnapshot.curveballFired)

    const payload = {
      conversationHistory: `${chat.buildTranscript()}\n\nSystem: Assessment ended by ${reason}.`,
      codeSnapshots: [...chat.getCodeSnapshots(), code].filter((snapshot, index, all) => all.indexOf(snapshot) === index),
      timeElapsedSeconds: EXAM_DURATION_SECONDS - timerSnapshot.secondsLeft,
      curveballFired: timerSnapshot.curveballFired,
      curveballAddressed: finalCurveballAddressed || exam.examState.curveballAddressed,
      studentName,
    }

    sessionStorage.removeItem(SESSION_KEYS.RESULTS)
    sessionStorage.setItem(SESSION_KEYS.EVALUATION_PAYLOAD, JSON.stringify(payload))
    sessionStorage.setItem(SESSION_KEYS.EVALUATION_PENDING, "true")
    navigateTo("/results")
  }, [chat, code, exam, studentName])

  const onCurveball = useCallback(() => {
    chat.injectCurveball()
    exam.markCurveballSeen()
  }, [chat, exam])

  const timer = useExamTimer({
    onCurveball,
    onExpire: () => handleSubmit("timeout"),
    autoStart: true,
  })

  useEffect(() => {
    timerSnapshotRef.current = {
      secondsLeft: timer.secondsLeft,
      curveballFired: timer.curveballFired,
    }
  }, [timer.secondsLeft, timer.curveballFired])

  useEffect(() => {
    const storedName = sessionStorage.getItem(SESSION_KEYS.STUDENT_NAME)
    if (!storedName) {
      navigateTo("/")
      return
    }
    setStudentName(storedName)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "`") setDebugVisible(prev => !prev)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  function handleRun() {
    terminal.executeCode(code)
    chat.addCodeSnapshot(code)
    exam.updateFromCode(code, timer.curveballFired)
  }

  function handleChatSend(text: string) {
    const intent = exam.recordIntent(text)
    const lower = text.toLowerCase()
    const hintRequested = lower.includes("hint") || lower.includes("help") || lower.includes("confused")
    if (hintRequested) exam.incrementHints()
    exam.incrementTurns()

    const codeState = deriveCodeState(code)
    const curveballSeen = exam.examState.curveballSeen || timer.curveballFired
    const stateForChat = {
      ...exam.examState,
      lastIntentClass: intent,
      turnsElapsed: exam.examState.turnsElapsed + 1,
      hintsGiven: exam.examState.hintsGiven + (hintRequested ? 1 : 0),
      lastCodeState: codeState,
      bugFixed: codeState === "FIXED_SLOW" || codeState === "FIXED_FAST",
      approach: deriveApproach(code, codeState),
      curveballSeen,
      curveballAddressed: codeState === "FIXED_FAST" && curveballSeen,
    }

    exam.updateFromCode(code, timer.curveballFired)
    chat.sendMessage(text, stateForChat, code)
  }

  function handleCopy() {
    navigator.clipboard?.writeText(code).catch(() => undefined)
  }

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0f0f0f" }}>
      <ExamTimer secondsLeft={timer.secondsLeft} studentName={studentName} />

      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "55% 45%",
        minHeight: 0,
      }}>
        <CodeEditor
          value={code}
          onChange={setCode}
          onRun={handleRun}
          onCopy={handleCopy}
          disabled={submitting}
        />
        <ChatPanel
          messages={chat.messages}
          isTyping={chat.isTyping}
          onSendMessage={handleChatSend}
          disabled={submitting}
        />
      </div>

      <MockTerminal outputs={terminal.outputs} />

      <div style={{
        position: "fixed",
        right: "18px",
        bottom: "176px",
        display: "flex",
        gap: "8px",
        zIndex: 30,
      }}>
        <button
          onClick={() => handleSubmit("manual")}
          disabled={submitting}
          style={{
            background: submitting ? "#27272a" : "#22c55e",
            border: "none",
            borderRadius: "8px",
            color: "white",
            padding: "10px 14px",
            fontWeight: 800,
            fontSize: "13px",
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          }}
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Opening results..." : "Submit Assessment"}
        </button>
      </div>

      {submitting && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.62)",
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            border: "1px solid #3730a3",
            background: "#111",
            borderRadius: "14px",
            padding: "22px 26px",
            color: "#e4e4e4",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          }}>
            <Loader2 size={22} className="animate-spin" color="#818cf8" />
            Sending session to results evaluator...
          </div>
        </div>
      )}

      <ExamStateDebugPanel examState={exam.examState} visible={debugVisible} />
    </main>
  )
}
