import { useState, useCallback } from "react"
import { ExamState, IntentClass } from "../types/index"
import { classifyIntent, deriveApproach, deriveCodeState } from "../lib/codeAnalysis"

const INITIAL_STATE: ExamState = {
  bugFixed: false,
  approach: "unknown",
  curveballSeen: false,
  curveballAddressed: false,
  hintsGiven: 0,
  turnsElapsed: 0,
  lastCodeState: "BUGGY_ORIGINAL",
  lastIntentClass: "NOVEL_INPUT",
}

export function useExamState() {
  const [examState, setExamState] = useState<ExamState>(INITIAL_STATE)

  const updateFromCode = useCallback((code: string, curveballSeen: boolean) => {
    const codeState = deriveCodeState(code)
    setExamState(prev => ({
      ...prev,
      lastCodeState: codeState,
      bugFixed: codeState === "FIXED_SLOW" || codeState === "FIXED_FAST",
      approach: deriveApproach(code, codeState),
      curveballSeen: prev.curveballSeen || curveballSeen,
      curveballAddressed: codeState === "FIXED_FAST" && (prev.curveballSeen || curveballSeen),
    }))
  }, [])

  const incrementTurns = useCallback(() => {
    setExamState(prev => ({ ...prev, turnsElapsed: prev.turnsElapsed + 1 }))
  }, [])

  const incrementHints = useCallback(() => {
    setExamState(prev => ({ ...prev, hintsGiven: prev.hintsGiven + 1 }))
  }, [])

  const markCurveballSeen = useCallback(() => {
    setExamState(prev => ({ ...prev, curveballSeen: true }))
  }, [])

  const recordIntent = useCallback((message: string): IntentClass => {
    const intent = classifyIntent(message)
    setExamState(prev => ({ ...prev, lastIntentClass: intent }))
    return intent
  }, [])

  return {
    examState,
    updateFromCode,
    incrementTurns,
    incrementHints,
    markCurveballSeen,
    recordIntent,
  }
}
