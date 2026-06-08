import { Router, Request, Response } from "express"
import {
  createExamSession,
  getExamSession,
  hasDatabase,
  listSessionEvents,
  recordAgentEvent,
  recordCodeSnapshot,
  submitSession,
} from "../lib/db.js"
import { deriveCodeState } from "../lib/examStateManager.js"

const router = Router()

router.post("/", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  const { orgSlug, studentName, email, inviteToken } = req.body || {}
  if (!orgSlug || !studentName) {
    return res.status(400).json({ error: "orgSlug and studentName are required" })
  }

  try {
    const session = await createExamSession({ orgSlug, studentName, email, inviteToken })
    await recordAgentEvent({
      sessionId: session.id,
      eventType: "message",
      actor: "system",
      content: "Session started",
      metadata: { orgSlug, studentName },
    })
    return res.status(201).json(session)
  } catch (err: any) {
    console.error("[Session] Create failed:", err?.message)
    return res.status(500).json({ error: err?.message || "Failed to create session" })
  }
})

router.get("/:sessionId", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  try {
    const session = await getExamSession(req.params.sessionId)
    if (!session) return res.status(404).json({ error: "Session not found" })
    return res.json(session)
  } catch (err: any) {
    console.error("[Session] Fetch failed:", err?.message)
    return res.status(500).json({ error: "Failed to load session" })
  }
})

router.get("/:sessionId/events", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  try {
    return res.json(await listSessionEvents(req.params.sessionId))
  } catch (err: any) {
    console.error("[Session] Events fetch failed:", err?.message)
    return res.status(500).json({ error: "Failed to load session events" })
  }
})

router.post("/:sessionId/events", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  const { eventType, actor, content, metadata } = req.body || {}
  if (!eventType || !actor) {
    return res.status(400).json({ error: "eventType and actor are required" })
  }

  try {
    await recordAgentEvent({
      sessionId: req.params.sessionId,
      eventType,
      actor,
      content,
      metadata,
    })
    return res.status(201).json({ ok: true })
  } catch (err: any) {
    console.error("[Session] Event write failed:", err?.message)
    return res.status(500).json({ error: "Failed to record event" })
  }
})

router.post("/:sessionId/snapshots", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  const { code, stdout, stderr, exitCode, testResults } = req.body || {}
  if (!code) return res.status(400).json({ error: "code is required" })

  try {
    await recordCodeSnapshot({
      sessionId: req.params.sessionId,
      code,
      codeState: deriveCodeState(code),
      stdout,
      stderr,
      exitCode,
      testResults,
    })
    return res.status(201).json({ ok: true })
  } catch (err: any) {
    console.error("[Session] Snapshot write failed:", err?.message)
    return res.status(500).json({ error: "Failed to record code snapshot" })
  }
})

router.post("/:sessionId/submit", async (req: Request, res: Response) => {
  if (!hasDatabase()) return res.status(503).json({ error: "DATABASE_URL not configured" })

  const { finalCode, timeElapsedSeconds, curveballFired } = req.body || {}
  if (!finalCode) return res.status(400).json({ error: "finalCode is required" })

  try {
    const session = await submitSession({
      sessionId: req.params.sessionId,
      finalCode,
      timeElapsedSeconds,
      curveballFired,
    })
    await recordAgentEvent({
      sessionId: req.params.sessionId,
      eventType: "submission",
      actor: "student",
      content: "Assessment submitted",
      metadata: { timeElapsedSeconds, curveballFired },
    })
    return res.json(session)
  } catch (err: any) {
    console.error("[Session] Submit failed:", err?.message)
    return res.status(500).json({ error: "Failed to submit session" })
  }
})

export default router
