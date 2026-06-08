import { Router, Request, Response } from "express"
import { createSimulatorModel } from "../agents/simulator.js"
import { CAG_STATIC_REPLIES, classifyIntent } from "../agents/intentClassifier.js"
import { buildCompressedContext, enforceAlternatingRoles } from "../lib/contextBuilder.js"
import { createInitialExamState, deriveCodeState } from "../lib/examStateManager.js"
import { withRetry } from "../lib/retryWrapper.js"
import {
  getTenantConfigBySlug,
  hasDatabase,
  recordAgentEvent,
  recordCodeSnapshot,
} from "../lib/db.js"
import { fetchDocs } from "../tools/docFetcherTool.js"
import { searchWeb } from "../tools/webSearchTool.js"
import { ChatRequestBody, GeminiMessage, TenantConfig } from "../types/index.js"

const router = Router()

router.post("/", async (req: Request, res: Response) => {
  const body = req.body as ChatRequestBody
  const { messages, studentName, examState, sessionId, orgSlug } = body

  if (!messages || !studentName) {
    return res.status(400).json({ error: "messages and studentName are required" })
  }

  const lastUserMessage = messages.filter(m => m.role === "user").slice(-1)[0]
  const lastMessageText = lastUserMessage?.parts?.map(p => p.text).join("\n") || ""
  const intent = classifyIntent(lastMessageText)
  const latestCodeInMessage = lastMessageText.match(/```[\s\S]*?```/)?.[0] || lastMessageText
  const codeState = deriveCodeState(latestCodeInMessage)
  const stateForContext = { ...(examState || createInitialExamState()), lastIntentClass: intent }

  console.log(`[Chat] Intent: ${intent} | Code: ${codeState} | Student: ${studentName}`)

  await persistStudentTurn({ sessionId, lastMessageText, intent, codeState, latestCodeInMessage })

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no")

  const staticReply = CAG_STATIC_REPLIES[intent]?.[0]
  if (staticReply) {
    res.write(`data: ${JSON.stringify({ text: staticReply, source: "cag" })}\n\n`)
    res.write("data: [DONE]\n\n")
    res.end()
    await persistAgentTurn({ sessionId, content: staticReply, intent, codeState, source: "cag" })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: "GEMINI_API_KEY not configured" })}\n\n`)
    res.end()
    return
  }

  const tenant = await loadTenant(orgSlug)
  const messagesWithToolContext = await addToolContext(messages, intent, lastMessageText, tenant, sessionId)
  const compressedMessages = buildCompressedContext(
    enforceAlternatingRoles(messagesWithToolContext),
    stateForContext
  )

  try {
    const model = createSimulatorModel(apiKey, studentName, tenant)
    const result = await withRetry(
      () => model.generateContentStream({ contents: compressedMessages }),
      3,
      "Simulator stream"
    )

    let responseText = ""

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        responseText += text
        res.write(`data: ${JSON.stringify({ text, source: "llm" })}\n\n`)
      }
    }

    res.write("data: [DONE]\n\n")
    res.end()
    await persistAgentTurn({ sessionId, content: responseText, intent, codeState, source: "llm" })
  } catch (err: any) {
    console.error("[Chat] Stream error:", err?.message)
    const isRateLimit = err?.status === 429 || err?.message?.includes("429")
    const errorMsg = isRateLimit
      ? "Rate limited. Please wait a moment and try again."
      : "Connection error. Please try again."
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
    res.end()
  }
})

async function loadTenant(orgSlug?: string): Promise<TenantConfig | null> {
  if (!orgSlug || !hasDatabase()) return null

  try {
    return await getTenantConfigBySlug(orgSlug)
  } catch (err: any) {
    console.warn("[Chat] Tenant config unavailable:", err?.message)
    return null
  }
}

async function addToolContext(
  messages: GeminiMessage[],
  intent: string,
  message: string,
  tenant: TenantConfig | null,
  sessionId?: string
): Promise<GeminiMessage[]> {
  const toolNotes: string[] = []

  if (intent === "DOUBT_DEEP" && tenant?.exam.knowledgeBaseUrls.length) {
    const docs = await fetchDocs(tenant.exam.knowledgeBaseUrls)
    if (docs.length) {
      toolNotes.push(
        `Documentation excerpts:\n${docs.map((doc) => `Source: ${doc.title} (${doc.url})\n${doc.text}`).join("\n\n")}`
      )
      await persistToolCall(sessionId, "docFetcher", { count: docs.length, urls: docs.map((doc) => doc.url) })
    }
  }

  if (intent === "CONCEPT_QUESTION" && process.env.TAVILY_API_KEY) {
    try {
      const results = await searchWeb(message)
      if (results.length) {
        toolNotes.push(
          `Web search excerpts:\n${results.map((item) => `Source: ${item.title} (${item.url})\n${item.content}`).join("\n\n")}`
        )
        await persistToolCall(sessionId, "webSearch", { count: results.length, urls: results.map((item) => item.url) })
      }
    } catch (err: any) {
      console.warn("[Chat] Web search skipped:", err?.message)
    }
  }

  if (!toolNotes.length) return messages

  return [
    ...messages,
    {
      role: "user",
      parts: [{ text: `[SYSTEM_STATE]\n${toolNotes.join("\n\n")}` }],
    },
  ]
}

async function persistToolCall(sessionId: string | undefined, toolName: string, metadata: Record<string, unknown>) {
  if (!sessionId || !hasDatabase()) return

  try {
    await recordAgentEvent({
      sessionId,
      eventType: "tool_call",
      actor: "system",
      content: toolName,
      metadata,
    })
  } catch (err: any) {
    console.warn("[Chat] Tool event persistence skipped:", err?.message)
  }
}

async function persistStudentTurn(input: {
  sessionId?: string
  lastMessageText: string
  intent: string
  codeState: string
  latestCodeInMessage: string
}) {
  if (!input.sessionId || !hasDatabase()) return

  try {
    await recordAgentEvent({
      sessionId: input.sessionId,
      eventType: "message",
      actor: "student",
      content: input.lastMessageText,
      metadata: { intent: input.intent, codeState: input.codeState },
    })

    if (input.intent === "CODE_PASTE" && input.latestCodeInMessage.trim()) {
      await recordCodeSnapshot({
        sessionId: input.sessionId,
        code: input.latestCodeInMessage,
        codeState: input.codeState,
      })
    }
  } catch (err: any) {
    console.warn("[Chat] Student turn persistence skipped:", err?.message)
  }
}

async function persistAgentTurn(input: {
  sessionId?: string
  content: string
  intent: string
  codeState: string
  source: "cag" | "llm"
}) {
  if (!input.sessionId || !hasDatabase() || !input.content.trim()) return

  try {
    await recordAgentEvent({
      sessionId: input.sessionId,
      eventType: "message",
      actor: "agent",
      content: input.content,
      metadata: {
        intent: input.intent,
        codeState: input.codeState,
        source: input.source,
      },
    })
  } catch (err: any) {
    console.warn("[Chat] Agent turn persistence skipped:", err?.message)
  }
}

export default router
