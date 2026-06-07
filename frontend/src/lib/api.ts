import { BACKEND_URL } from "./constants"
import { EvaluationResult, ExamState, GeminiMessage } from "../types/index"

export async function streamChat(
  messages: GeminiMessage[],
  studentName: string,
  examState: ExamState,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
) {
  let response: Response

  try {
    response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        studentName,
        examState,
      }),
    })
  } catch {
    onError("Cannot reach the backend. Make sure it is running on port 3001.")
    return
  }

  if (!response.ok) {
    onError(`Chat request failed with status ${response.status}`)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onError("No response stream received.")
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split("\n\n")
    buffer = parts.pop() ?? ""

    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith("data: ")) continue

      const payload = line.slice(6).trim()
      if (payload === "[DONE]") {
        onDone()
        return
      }

      try {
        const parsed = JSON.parse(payload)
        if (parsed.text) onChunk(parsed.text)
        if (parsed.error) {
          onError(parsed.error)
          return
        }
      } catch {
        // Ignore partial or malformed chunks.
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Evaluation failed with status ${response.status}`)
  }

  return response.json()
}