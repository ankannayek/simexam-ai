import { ExamState, CodeState } from "../types/index.js"
import { cacheGet, cacheSet } from "./cache.js"

function withoutComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
}

function hasMergeSort(code: string): boolean {
  const normalized = withoutComments(code)
  const lower = normalized.toLowerCase()
  return (
    (lower.includes("mergesort") || /\bmerge\b/.test(lower)) &&
    (normalized.includes("Math.floor") || normalized.includes("slice(") || />>\s*1/.test(normalized)) &&
    normalized.includes("slice(")
  )
}

function hasQuickSort(code: string): boolean {
  const normalized = withoutComments(code)
  const lower = normalized.toLowerCase()
  return (
    lower.includes("quicksort") ||
    lower.includes("quick sort") ||
    lower.includes("partition") ||
    (lower.includes("pivot") && (normalized.includes("filter(") || /for\s*\(/.test(normalized) || /while\s*\(/.test(normalized)))
  )
}

function hasHeapSort(code: string): boolean {
  const lower = withoutComments(code).toLowerCase()
  return lower.includes("heapsort") || lower.includes("heapify") || lower.includes("siftdown")
}

function isFastCustomSort(code: string): boolean {
  return hasMergeSort(code) || hasQuickSort(code) || hasHeapSort(code)
}

function usesBuiltInSort(code: string): boolean {
  return withoutComments(code).includes(".sort(")
}

/**
 * examStateManager — derives ExamState from the student's code.
 *
 * DEMO mode: deterministic pattern matching powers terminal/state behavior.
 * PRODUCTION design: the same finite CodeState values form the CAG key space.
 */
export function deriveCodeState(code: string): CodeState {
  const normalized = withoutComments(code || "")
  if (!normalized || normalized.trim().length < 20) return "UNKNOWN"

  if (usesBuiltInSort(normalized) && !isFastCustomSort(normalized)) return "BUILT_IN_SORT"

  if (
    isFastCustomSort(normalized) &&
    !normalized.includes("j < n - i;") &&
    !normalized.includes("j < n-i;")
  ) {
    return "FIXED_FAST"
  }

  if (
    (normalized.includes("n - i - 1") || normalized.includes("n-i-1")) &&
    !isFastCustomSort(normalized)
  ) {
    return "FIXED_SLOW"
  }

  if (normalized.includes("j < n - i;") || normalized.includes("j < n-i;")) return "BUGGY_ORIGINAL"

  return "UNKNOWN"
}

export function updateExamState(
  current: ExamState,
  newCodeState: CodeState,
  curveballSeen: boolean,
  messageCount: number
): ExamState {
  return {
    ...current,
    bugFixed: newCodeState === "FIXED_SLOW" || newCodeState === "FIXED_FAST",
    approach:
      newCodeState === "FIXED_FAST" ? current.approach === "quicksort" ? "quicksort" : "merge"
      : newCodeState === "FIXED_SLOW" || newCodeState === "BUGGY_ORIGINAL" ? "bubble"
      : "unknown",
    curveballSeen: current.curveballSeen || curveballSeen,
    curveballAddressed: newCodeState === "FIXED_FAST" && (current.curveballSeen || curveballSeen),
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
    lastCodeState: "BUGGY_ORIGINAL",
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
