import { GeminiMessage, EvaluationResult, ExamState } from "../types/index"
import { BACKEND_URL } from "./constants"

export async function streamChat(
  messages: GeminiMessage[],
  studentName: string,
  examState: ExamState,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  let response: Response

  try {
    response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, studentName, examState }),
    })
  } catch {
    onError("Cannot reach backend. Is the server running on port 3001?")
    return
  }

  if (!response.ok) {
    onError(`Backend error: ${response.status}`)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onError("No response stream")
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const data = line.slice(6).trim()
      if (data === "[DONE]") {
        onDone()
        return
      }
      try {
        const parsed = JSON.parse(data) as { text?: string; error?: string }
        if (parsed.text) onChunk(parsed.text)
        if (parsed.error) {
          onError(parsed.error)
          return
        }
      } catch {
        // Skip partial JSON chunks.
      }
    }
  }

  onDone()
}

export async function evaluateSession(payload: {
  conversationHistory: string
  codeSnapshots: string[]
  timeElapsedSeconds: number
  curveballFired: boolean
  curveballAddressed: boolean
  studentName: string
}): Promise<EvaluationResult> {
  const response = await fetch(`${BACKEND_URL}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Evaluate failed: ${response.status}`)
  }

  return response.json()
}
