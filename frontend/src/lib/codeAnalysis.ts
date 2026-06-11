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

  if (!text || text.length < 5) {
    return "INITIAL"
  }

  return "COMPILING"
}

export function deriveApproach(codeState: CodeState): string {
  if (codeState === "INITIAL") return "unknown"
  return "in-progress"
}