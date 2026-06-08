import { Router, Request, Response } from "express"
import { hasDatabase, recordAgentEvent, recordCodeSnapshot } from "../lib/db.js"
import { deriveCodeState } from "../lib/examStateManager.js"
import { ExecuteRequestBody, ExecuteResult } from "../types/index.js"

const router = Router()

const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
}

router.post("/", async (req: Request, res: Response) => {
  const body = req.body as ExecuteRequestBody
  if (!body?.code) return res.status(400).json({ error: "code is required" })

  try {
    const result = process.env.JUDGE0_URL
      ? await executeWithJudge0(body.code, body.language || "javascript")
      : analyzeWithoutSandbox(body.code)

    if (body.sessionId && hasDatabase()) {
      const codeState = deriveCodeState(body.code)
      await recordCodeSnapshot({
        sessionId: body.sessionId,
        code: body.code,
        codeState,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        testResults: {
          testsPassed: result.testsPassed,
          testsTotal: result.testsTotal,
          mode: process.env.JUDGE0_URL ? "judge0" : "analysis",
        },
      })
      await recordAgentEvent({
        sessionId: body.sessionId,
        eventType: "code_run",
        actor: "student",
        content: "Code executed",
        metadata: { codeState, status: result.status, testsPassed: result.testsPassed, testsTotal: result.testsTotal },
      })
    }

    return res.json(result)
  } catch (err: any) {
    console.error("[Execute] Failed:", err?.message)
    return res.status(500).json({ error: "Execution failed" })
  }
})

async function executeWithJudge0(code: string, language: string): Promise<ExecuteResult> {
  const baseUrl = process.env.JUDGE0_URL!.replace(/\/$/, "")
  const languageId = LANGUAGE_IDS[language.toLowerCase()] || LANGUAGE_IDS.javascript
  const headers: Record<string, string> = { "Content-Type": "application/json" }

  if (process.env.JUDGE0_API_KEY) headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY
  if (process.env.JUDGE0_HOST) headers["X-RapidAPI-Host"] = process.env.JUDGE0_HOST

  const response = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: code,
      language_id: languageId,
      cpu_time_limit: Number(process.env.JUDGE0_CPU_LIMIT || 2),
      memory_limit: Number(process.env.JUDGE0_MEMORY_LIMIT || 128000),
    }),
  })

  if (!response.ok) {
    throw new Error(`Judge0 returned ${response.status}`)
  }

  const payload = await response.json() as {
    stdout?: string
    stderr?: string
    compile_output?: string
    status?: { id: number; description: string }
  }

  const stderr = payload.stderr || payload.compile_output || ""
  const stdout = payload.stdout || ""
  const exitCode = payload.status?.id === 3 ? 0 : 1
  const status = exitCode === 0 ? "success" : "error"

  return {
    stdout,
    stderr,
    exitCode,
    status,
    lines: [
      payload.status?.description || (exitCode === 0 ? "Accepted" : "Execution failed"),
      ...stdout.trim().split("\n").filter(Boolean),
      ...stderr.trim().split("\n").filter(Boolean),
    ],
  }
}

function analyzeWithoutSandbox(code: string): ExecuteResult {
  const codeState = deriveCodeState(code)

  if (codeState === "FIXED_FAST") {
    return {
      stdout: "[1,2,5,8,9,12]\n[-3,0,4,4]\n[]",
      stderr: "",
      exitCode: 0,
      status: "success",
      testsPassed: 3,
      testsTotal: 3,
      lines: [
        "Static execution mode: Judge0 is not configured.",
        "Detected custom O(n log n) sort and fixed loop-bound issue.",
        "3/3 representative checks pass by code analysis.",
      ],
    }
  }

  if (codeState === "FIXED_SLOW") {
    return {
      stdout: "[1,2,5,8,9,12]",
      stderr: "Performance check failed: O(n^2) approach remains.",
      exitCode: 0,
      status: "warning",
      testsPassed: 2,
      testsTotal: 3,
      lines: [
        "Static execution mode: Judge0 is not configured.",
        "Correctness bug appears fixed.",
        "Performance requirement still needs O(n log n).",
      ],
    }
  }

  if (codeState === "BUILT_IN_SORT") {
    return {
      stdout: "[1,2,5,8,9,12]",
      stderr: "Built-in Array.sort is not accepted for this assessment.",
      exitCode: 0,
      status: "warning",
      testsPassed: 1,
      testsTotal: 3,
      lines: [
        "Static execution mode: Judge0 is not configured.",
        "Built-in .sort() was detected.",
        "Use a custom comparison sort for the assessment.",
      ],
    }
  }

  return {
    stdout: "",
    stderr: "The original loop-bound issue or an unknown code state remains.",
    exitCode: 1,
    status: "error",
    testsPassed: codeState === "BUGGY_ORIGINAL" ? 0 : undefined,
    testsTotal: codeState === "BUGGY_ORIGINAL" ? 3 : undefined,
    lines: [
      "Static execution mode: Judge0 is not configured.",
      codeState === "BUGGY_ORIGINAL"
        ? "Detected the original inner loop bound: j < n - i."
        : "Could not verify the submitted approach from static analysis.",
    ],
  }
}

export default router
