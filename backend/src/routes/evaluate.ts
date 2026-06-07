import { Router, Request, Response } from "express"
import { createEvaluatorModel, buildEvaluationPrompt } from "../agents/evaluator.js"
import { withRetry } from "../lib/retryWrapper.js"
import { EvaluateRequestBody, EvaluationResult } from "../types/index.js"

const router = Router()

router.post("/", async (req: Request, res: Response) => {
  const body = req.body as EvaluateRequestBody

  if (!body.conversationHistory || !body.studentName) {
    return res.status(400).json({ error: "conversationHistory and studentName are required" })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" })
  }

  console.log(`[Evaluate] Starting evaluation for: ${body.studentName}`)
  console.log(`[Evaluate] Time elapsed: ${body.timeElapsedSeconds}s | Curveball addressed: ${body.curveballAddressed}`)

  // PRODUCTION: enqueue BullMQ job and return { jobId, status: "queued" } immediately.
  // Worker pool would cap Gemini calls at 50 concurrent tasks, while a deterministic
  // rule-based scorer gives instant fallback feedback.
  try {
    const model = createEvaluatorModel(apiKey)
    const prompt = buildEvaluationPrompt(body)

    const result = await withRetry(
      () => model.generateContent(prompt),
      3,
      "Evaluator"
    )

    const jsonText = result.response.text()
    const clean = jsonText.replace(/```json\n?|```\n?/g, "").trim()
    const scores = JSON.parse(clean) as EvaluationResult

    console.log(`[Evaluate] Result for ${body.studentName}:`, {
      technicalAccuracy: scores.technicalAccuracy,
      adaptability: scores.adaptability,
      passed: scores.passed,
    })

    return res.json(scores)
  } catch (err: any) {
    console.error("[Evaluate] Error:", err?.message)
    const fallback = computeFallbackScore(body)
    console.warn("[Evaluate] Using fallback rule-based scores")
    return res.json(fallback)
  }
})

function computeFallbackScore(body: EvaluateRequestBody): EvaluationResult {
  const finalCode = body.codeSnapshots[body.codeSnapshots.length - 1] || ""
  const lower = finalCode.toLowerCase()

  const hasMergeSort = (lower.includes("mergesort") || lower.includes("merge")) && (finalCode.includes("Math.floor") || finalCode.includes("slice("))
  const hasQuickSort = lower.includes("quicksort") || lower.includes("quick sort") || lower.includes("partition") || (lower.includes("pivot") && (finalCode.includes("filter(") || /for\s*\(/.test(finalCode) || /while\s*\(/.test(finalCode)))
  const hasHeapSort = lower.includes("heapsort") || lower.includes("heapify") || lower.includes("siftdown")
  const hasFastCustomSort = hasMergeSort || hasQuickSort || hasHeapSort
  const hasFixedBound = finalCode.includes("n - i - 1") || finalCode.includes("n-i-1")
  const addressedCurveball = body.curveballAddressed || (body.curveballFired && hasFastCustomSort)
  const fastApproach = hasQuickSort ? "quicksort" : hasMergeSort ? "merge sort" : hasHeapSort ? "heap sort" : "custom O(n log n) sort"

  const technicalAccuracy = hasFastCustomSort ? 9 : hasFixedBound ? 6 : 3
  const adaptability = addressedCurveball ? 9 : body.curveballFired ? 3 : 5
  const communication = body.conversationHistory.split("Student:").length > 3 ? 7 : 5
  const efficiency = body.timeElapsedSeconds < 360 ? 8 : body.timeElapsedSeconds < 540 ? 6 : 4

  return {
    technicalAccuracy,
    adaptability,
    communication,
    efficiency,
    overallFeedback: hasFastCustomSort
      ? `Strong performance. ${body.studentName} corrected the sorting behavior and upgraded to ${fastApproach}, satisfying the O(n log n) constraint after the PM curveball.`
      : hasFixedBound
      ? `Partial success. ${body.studentName} fixed the loop bound bug but did not complete the performance optimization to O(n log n) within the time limit. The core bug was understood.`
      : `The session showed the candidate is still developing fundamental debugging skills. The loop bound error was not corrected in the final submission.`,
    strengths: [
      hasFastCustomSort ? `Successfully implemented ${fastApproach} under time pressure` : "Engaged actively with the problem throughout",
      communication > 5 ? "Asked clarifying questions before diving into implementation" : "Demonstrated persistence in working through the problem",
    ],
    improvements: [
      !hasFastCustomSort ? "Practice identifying off-by-one errors and performance constraints in nested loops" : "Consider edge cases more explicitly in the implementation",
      "Explain the reasoning behind each change as you make it",
    ],
    passed: technicalAccuracy >= 6 && adaptability >= 5,
  }
}

export default router
