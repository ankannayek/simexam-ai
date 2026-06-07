export type MessageRole = "student" | "simulator" | "pm" | "system"

export type IntentClass =
  | "HINT_REQUEST"
  | "CODE_PASTE"
  | "CONCEPT_QUESTION"
  | "CURVEBALL_ACK"
  | "DONE_SIGNAL"
  | "OFF_TOPIC"
  | "NOVEL_INPUT"

export type CodeState =
  | "BUGGY_ORIGINAL"
  | "FIXED_SLOW"
  | "FIXED_FAST"
  | "BUILT_IN_SORT"
  | "UNKNOWN"

export interface ExamState {
  bugFixed: boolean
  approach: "bubble" | "merge" | "quicksort" | "unknown"
  curveballSeen: boolean
  curveballAddressed: boolean
  hintsGiven: number
  turnsElapsed: number
  lastCodeState: CodeState
  lastIntentClass: IntentClass
}

export interface GeminiMessage {
  role: "user" | "model"
  parts: Array<{ text: string }>
}

export interface ChatRequestBody {
  messages: GeminiMessage[]
  studentName: string
  examState: ExamState
}

export interface EvaluateRequestBody {
  conversationHistory: string
  codeSnapshots: string[]
  timeElapsedSeconds: number
  curveballFired: boolean
  curveballAddressed: boolean
  studentName: string
}

export interface EvaluationResult {
  technicalAccuracy: number
  adaptability: number
  communication: number
  efficiency: number
  overallFeedback: string
  strengths: string[]
  improvements: string[]
  passed: boolean
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  streaming?: boolean
  isError?: boolean
}

export interface TerminalOutput {
  lines: string[]
  status: "success" | "warning" | "error" | "idle"
  timestamp: string
}