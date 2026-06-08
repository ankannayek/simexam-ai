import { Router, Request, Response } from "express"
import { createEvaluatorModel, buildEvaluationPrompt } from "../agents/evaluator.js"
import { getTenantConfigBySlug, hasDatabase, recordEvaluation } from "../lib/db.js"
import { deriveCodeState } from "../lib/examStateManager.js"
import { withRetry } from "../lib/retryWrapper.js"
import { EvaluateRequestBody, EvaluationResult, TenantConfig } from "../types/index.js"

const router = Router()

router.post("/", async (req: Request, res: Response) => {
  const body = req.body as EvaluateRequestBody

  if (!body.conversationHistory || !body.studentName) {
    return res.status(400).json({ error: "conversationHistory and studentName are required" })
  }

  console.log(`[Evaluate] Starting evaluation for: ${body.studentName}`)

  const tenant = await loadTenant(body.orgSlug)
  const deterministic = computeDeterministicEvaluation(body, tenant)
  let result = deterministic

  if (process.env.GEMINI_API_KEY) {
    try {
      const model = createEvaluatorModel(process.env.GEMINI_API_KEY)
      const prompt = `${buildEvaluationPrompt(body)}

DETERMINISTIC GROUND TRUTH:
testsPassed: ${deterministic.testsPassed}/${deterministic.testsTotal}
technicalAccuracy: ${deterministic.technicalAccuracy}
adaptability: ${deterministic.adaptability}
passed: ${deterministic.passed}

The deterministic layer is binding. You may improve qualitative feedback, communication, efficiency, strengths, and improvements, but do not contradict test results.`

      const llm = await withRetry(
        () => model.generateContent(prompt),
        3,
        "Evaluator"
      )

      const parsed = JSON.parse(llm.response.text().replace(/```json\n?|```\n?/g, "").trim()) as EvaluationResult
      result = mergeBoundedEvaluation(deterministic, parsed)
    } catch (err: any) {
      console.warn("[Evaluate] Gemini qualitative layer skipped:", err?.message)
    }
  }

  if (body.sessionId && hasDatabase()) {
    try {
      await recordEvaluation({ sessionId: body.sessionId, result })
    } catch (err: any) {
      console.warn("[Evaluate] Persistence skipped:", err?.message)
    }
  }

  return res.json(result)
})

async function loadTenant(orgSlug?: string): Promise<TenantConfig | null> {
  if (!orgSlug || !hasDatabase()) return null

  try {
    return await getTenantConfigBySlug(orgSlug)
  } catch (err: any) {
    console.warn("[Evaluate] Tenant rubric unavailable:", err?.message)
    return null
  }
}

function computeDeterministicEvaluation(body: EvaluateRequestBody, tenant?: TenantConfig | null): EvaluationResult {
  const finalCode = body.codeSnapshots[body.codeSnapshots.length - 1] || ""
  const state = deriveCodeState(finalCode)
  const conversationTurns = body.conversationHistory.split("Student").length - 1
  const addressedCurveball = body.curveballAddressed || (body.curveballFired && state === "FIXED_FAST")

  const tests = (() => {
    switch (state) {
      case "FIXED_FAST":
        return { passed: 3, total: 3 }
      case "FIXED_SLOW":
        return { passed: 2, total: 3 }
      case "BUILT_IN_SORT":
        return { passed: 1, total: 3 }
      case "BUGGY_ORIGINAL":
        return { passed: 0, total: 3 }
      default:
        return { passed: 1, total: 3 }
    }
  })()

  const technicalAccuracy =
    state === "FIXED_FAST" ? 9 :
    state === "FIXED_SLOW" ? 6 :
    state === "BUILT_IN_SORT" ? 4 :
    state === "BUGGY_ORIGINAL" ? 2 :
    3

  const adaptability =
    addressedCurveball ? 9 :
    body.curveballFired ? 3 :
    state === "FIXED_FAST" ? 7 :
    5

  const communication = conversationTurns >= 4 ? 7 : conversationTurns >= 2 ? 6 : 5
  const efficiency = body.timeElapsedSeconds < 360 ? 8 : body.timeElapsedSeconds < 540 ? 6 : 4
  const doubtResolution = body.conversationHistory.toLowerCase().includes("hint") ? 7 : 5
  const passed = technicalAccuracy >= 6 && adaptability >= 5

  const dimensionScores = buildDimensionScores(tenant, {
    technicalAccuracy,
    adaptability,
    communication,
    efficiency,
    doubtResolution,
  })

  return {
    technicalAccuracy,
    adaptability,
    communication,
    efficiency,
    doubtResolution,
    testsPassed: tests.passed,
    testsTotal: tests.total,
    dimensionScores,
    overallFeedback: buildFeedback(body.studentName, state, passed, addressedCurveball),
    strengths: [
      state === "FIXED_FAST" ? "Moved to a custom O(n log n) sorting approach." : "Stayed engaged with the debugging task.",
      communication >= 6 ? "Communicated enough context for the interviewer to follow progress." : "Kept working through the issue instead of abandoning the task.",
    ],
    improvements: [
      state !== "FIXED_FAST" ? "Practice moving from a local correctness fix to a scalable algorithmic fix." : "State edge-case reasoning more explicitly before submitting.",
      "Tie each code change to the observed terminal output or test result.",
    ],
    passed,
  }
}

function buildDimensionScores(
  tenant: TenantConfig | null | undefined,
  scores: Record<string, number>
): Record<string, number> {
  if (!tenant?.rubric.dimensions.length) return scores

  return tenant.rubric.dimensions.reduce<Record<string, number>>((acc, dimension) => {
    const key = dimension.name.replace(/\s+/g, "").replace(/^[A-Z]/, c => c.toLowerCase())
    acc[dimension.name] = scores[key] ?? scores.technicalAccuracy
    return acc
  }, {})
}

function buildFeedback(studentName: string, state: string, passed: boolean, addressedCurveball: boolean): string {
  if (state === "FIXED_FAST") {
    return `${studentName} fixed the core sorting issue and addressed the performance constraint with a custom faster approach. The final submission meets the practical bar${addressedCurveball ? " after the requirement change" : ""}.`
  }

  if (state === "FIXED_SLOW") {
    return `${studentName} fixed the local loop-bound bug, but the final approach still does not meet the O(n log n) requirement. This is a partial pass on debugging and a miss on scalability.`
  }

  return `${studentName} did not produce a final submission that clears the deterministic correctness and scalability checks. The next focus should be systematic test-driven debugging before optimizing.`
}

function mergeBoundedEvaluation(base: EvaluationResult, llm: EvaluationResult): EvaluationResult {
  const communication = clamp(Math.round(llm.communication ?? base.communication), base.communication - 2, base.communication + 2)
  const efficiency = clamp(Math.round(llm.efficiency ?? base.efficiency), base.efficiency - 2, base.efficiency + 2)

  return {
    ...base,
    communication,
    efficiency,
    overallFeedback: llm.overallFeedback || base.overallFeedback,
    strengths: normalizeList(llm.strengths, base.strengths),
    improvements: normalizeList(llm.improvements, base.improvements),
    dimensionScores: {
      ...base.dimensionScores,
      communication,
      efficiency,
    },
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeList(value: string[] | undefined, fallback: string[]): string[] {
  if (!Array.isArray(value) || value.length === 0) return fallback
  return value.slice(0, 2)
}

export default router
