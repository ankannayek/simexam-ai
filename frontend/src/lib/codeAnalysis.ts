import { CodeState, IntentClass } from "../types/index"

function withoutComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
}

export function hasMergeSort(code: string): boolean {
  const normalized = withoutComments(code)
  const lower = normalized.toLowerCase()
  return (
    (lower.includes("mergesort") || /\bmerge\b/.test(lower)) &&
    (normalized.includes("Math.floor") || normalized.includes("slice(") || />>\s*1/.test(normalized)) &&
    normalized.includes("slice(")
  )
}

export function hasQuickSort(code: string): boolean {
  const normalized = withoutComments(code)
  const lower = normalized.toLowerCase()
  return (
    lower.includes("quicksort") ||
    lower.includes("quick sort") ||
    lower.includes("partition") ||
    (lower.includes("pivot") && (normalized.includes("filter(") || /for\s*\(/.test(normalized) || /while\s*\(/.test(normalized)))
  )
}

export function hasHeapSort(code: string): boolean {
  const lower = withoutComments(code).toLowerCase()
  return lower.includes("heapsort") || lower.includes("heapify") || lower.includes("siftdown")
}

export function usesBuiltInSort(code: string): boolean {
  return withoutComments(code).includes(".sort(")
}

export function isFastCustomSort(code: string): boolean {
  return hasMergeSort(code) || hasQuickSort(code) || hasHeapSort(code)
}

export function deriveCodeState(code: string): CodeState {
  const normalized = withoutComments(code)
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

export function deriveApproach(code: string, codeState: CodeState): "bubble" | "merge" | "quicksort" | "unknown" {
  if (hasQuickSort(code)) return "quicksort"
  if (hasMergeSort(code)) return "merge"
  if (codeState === "FIXED_SLOW" || codeState === "BUGGY_ORIGINAL") return "bubble"
  return "unknown"
}

export function classifyIntent(message: string): IntentClass {
  const lower = message.toLowerCase().trim()

  if (
    lower.includes("function ") ||
    lower.includes("const ") ||
    lower.includes("for (") ||
    lower.includes("while (") ||
    lower.includes("```")
  ) return "CODE_PASTE"

  if (
    lower.includes("alex") ||
    lower.includes("pm") ||
    lower.includes("memory") ||
    lower.includes("o(n log n)") ||
    lower.includes("merge sort") ||
    lower.includes("quick sort") ||
    lower.includes("quicksort") ||
    lower.includes("constraint")
  ) return "CURVEBALL_ACK"

  if (
    lower.includes("done") ||
    lower.includes("finished") ||
    lower.includes("submit") ||
    lower.includes("ready") ||
    lower.includes("complete")
  ) return "DONE_SIGNAL"

  if (
    lower.includes("hint") ||
    lower.includes("help") ||
    lower.includes("how do i") ||
    lower.includes("what should") ||
    lower.includes("where") ||
    lower.includes("why is") ||
    lower.includes("don't understand") ||
    lower.includes("confused")
  ) return "HINT_REQUEST"

  if (
    lower.includes("what is") ||
    lower.includes("what does") ||
    lower.includes("explain") ||
    lower.includes("difference between") ||
    lower.includes("complexity") ||
    lower.includes("big o") ||
    lower.includes("time complexity")
  ) return "CONCEPT_QUESTION"

  if (
    lower.includes("weather") ||
    lower.includes("joke") ||
    lower.includes("lunch") ||
    lower.includes("break") ||
    lower.length < 4
  ) return "OFF_TOPIC"

  return "NOVEL_INPUT"
}
