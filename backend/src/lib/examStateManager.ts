import { ExamState, CodeState } from "../types/index.js"
import { cacheGet, cacheSet } from "./cache.js"

export function deriveCodeState(code: string): CodeState {
  if (!code || code.trim().length < 5) return "INITIAL"
  // Generic fallback: Assume if they wrote significant code it's compiling/in progress.
  // In a real system, the Python microservice or AST evaluator would supply this state.
  return "COMPILING"
}

export function updateExamState(
  current: ExamState,
  newCodeState: CodeState,
  curveballSeen: boolean,
  messageCount: number
): ExamState {
  const isOptimized = newCodeState === "OPTIMIZED"
  
  return {
    ...current,
    bugFixed: current.bugFixed || isOptimized, // Just a generic fallback
    approach: current.approach === "unknown" ? "in-progress" : current.approach,
    curveballSeen: current.curveballSeen || curveballSeen,
    curveballAddressed: current.curveballAddressed || (isOptimized && (current.curveballSeen || curveballSeen)),
    turnsElapsed: messageCount,
    lastCodeState: newCodeState,
  }
}

export function createInitialExamState(): ExamState {
  return {
    bugFixed: false,
    approach: "unknown",
    curveballSeen: false,
    curveballAddressed: false,
    hintsGiven: 0,
    turnsElapsed: 0,
    lastCodeState: "INITIAL",
    lastIntentClass: "NOVEL_INPUT",
  }
}

// ── Redis State Persistence ───────────────────────────────────────

export async function getExamState(sessionId: string): Promise<ExamState | null> {
  return cacheGet<ExamState>(`exam_state:${sessionId}`)
}

export async function saveExamState(sessionId: string, state: ExamState): Promise<void> {
  // Store for 24 hours
  await cacheSet(`exam_state:${sessionId}`, state, 86400)
}
