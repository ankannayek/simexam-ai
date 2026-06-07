import { Router, Request, Response } from "express"
import { createSimulatorModel } from "../agents/simulator.js"
import { classifyIntent } from "../agents/intentClassifier.js"
import { buildCompressedContext, enforceAlternatingRoles } from "../lib/contextBuilder.js"
import { deriveCodeState, createInitialExamState } from "../lib/examStateManager.js"
import { withRetry } from "../lib/retryWrapper.js"
import { ChatRequestBody } from "../types/index.js"

const router = Router()

router.post("/", async (req: Request, res: Response) => {
  const body = req.body as ChatRequestBody
  const { messages, studentName, examState } = body

  if (!messages || !studentName) {
    return res.status(400).json({ error: "messages and studentName are required" })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" })
  }

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no")

  const lastUserMessage = messages.filter(m => m.role === "user").slice(-1)[0]
  const lastMessageText = lastUserMessage?.parts?.map(p => p.text).join("\n") || ""

  const intent = classifyIntent(lastMessageText)
  console.log(`[Chat] Intent: ${intent} | Student: ${studentName} | Turn: ${messages.length}`)

  const latestCodeInMessage = lastMessageText.match(/```[\s\S]*?```/)?.[0] || lastMessageText
  const codeState = deriveCodeState(latestCodeInMessage)
  console.log(`[Chat] Code state: ${codeState}`)

  const stateForContext = { ...(examState || createInitialExamState()), lastIntentClass: intent }

  const compressedMessages = buildCompressedContext(
    enforceAlternatingRoles(messages),
    stateForContext
  )

  try {
    const model = createSimulatorModel(apiKey, studentName)

    const result = await withRetry(
      () => model.generateContentStream({ contents: compressedMessages }),
      3,
      "Simulator stream"
    )

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    res.write("data: [DONE]\n\n")
    res.end()
  } catch (err: any) {
    console.error("[Chat] Stream error:", err?.message)
    const isRateLimit = err?.status === 429 || err?.message?.includes("429")
    const errorMsg = isRateLimit
      ? "Rate limited — please wait a moment and try again."
      : "Connection error — please try again."
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
    res.end()
  }
})

export default router
