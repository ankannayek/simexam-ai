import { CodeState, IntentClass } from "../types/index"

function compact(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim()
}

export function classifyIntent(message: string): IntentClass {
  const text = compact(message)

  if (
    text.includes("```") ||
    text.includes("function ") ||
    text.includes("const ") ||
    text.includes("let ") ||
    text.includes("var ") ||
    text.includes("class ")
  ) {
    return "CODE_PASTE"
  }

  if (
    text.includes("done") ||
    text.includes("finished") ||
    text.includes("submit") ||
    text.includes("ready") ||
    text.includes("complete")
  ) {
    return "DONE_SIGNAL"
  }

  if (
    text.includes("hint") ||
    text.includes("help") ||
    text.includes("explain") ||
    text.includes("why") ||
    text.includes("how does") ||
    text.includes("what is") ||
    text.includes("what does") ||
    text.includes("walk me through") ||
    text.includes("stuck") ||
    text.includes("confused")
  ) {
    return "HINT_REQUEST"
  }

  if (
    text.includes("complexity") ||
    text.includes("big o") ||
    text.includes("time complexity") ||
    text.includes("space complexity") ||
    text.includes("merge sort") ||
    text.includes("quick sort") ||
    text.includes("quicksort")
  ) {
    return "CONCEPT_QUESTION"
  }

  if (
    text.includes("memory") ||
    text.includes("constraint") ||
    text.includes("pm") ||
    text.includes("alex") ||
    text.includes("o(n log n)")
  ) {
    return "CURVEBALL_ACK"
  }

  if (
    text.includes("joke") ||
    text.includes("weather") ||
    text.includes("lunch") ||
    text.includes("break") ||
    text.length < 4
  ) {
    return "OFF_TOPIC"
  }

  return "NOVEL_INPUT"
}

export function deriveCodeState(code: string): CodeState {
  const text = compact(code)

  if (!text || text.length < 20) {
    return "UNKNOWN"
  }

  if (text.includes(".sort(") && !text.includes("merge") && !text.includes("quick")) {
    return "BUILT_IN_SORT"
  }

  if (
    text.includes("merge") &&
    text.includes("slice") &&
    text.includes("math.floor")
  ) {
    return "FIXED_FAST"
  }

  if (
    text.includes("quick") &&
    (text.includes("pivot") || text.includes("partition") || text.includes("left") || text.includes("right"))
  ) {
    return "FIXED_FAST"
  }

  if (
    text.includes("n - i - 1") ||
    text.includes("n-i-1")
  ) {
    return "FIXED_SLOW"
  }

  if (
    text.includes("j < n - i;") ||
    text.includes("j < n-i;")
  ) {
    return "BUGGY_ORIGINAL"
  }

  return "UNKNOWN"
}

export function deriveApproach(codeState: CodeState): "bubble" | "merge" | "quicksort" | "unknown" {
  switch (codeState) {
    case "BUGGY_ORIGINAL":
    case "FIXED_SLOW":
      return "bubble"
    case "FIXED_FAST":
      return "merge"
    case "BUILT_IN_SORT":
      return "quicksort"
    default:
      return "unknown"
  }
}