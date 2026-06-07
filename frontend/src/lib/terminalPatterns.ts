import { TerminalOutput } from "../types/index"
import { deriveCodeState, deriveApproach } from "./codeAnalysis"

function now(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}

export function runCode(code: string): TerminalOutput {
  const codeState = deriveCodeState(code)
  const approach = deriveApproach(code, codeState)

  if (!code || code.trim().length < 20) {
    return {
      lines: [
        "$ node production-sort.js",
        "Error: No executable code found.",
      ],
      status: "error",
      timestamp: now(),
    }
  }

  if (codeState === "FIXED_FAST") {
    const approachLabel = approach === "quicksort" ? "Quicksort" : approach === "merge" ? "Merge sort" : "Custom comparison sort"
    return {
      lines: [
        "$ node production-sort.js",
        "Running test suite...",
        "",
        "✓  Test 1 passed: [8,5,2,9,1,12] → [1,2,5,8,9,12]",
        "✓  Test 2 passed: [100,3,7,55]   → [3,7,55,100]",
        "✓  Test 3 passed: []              → []",
        "✓  Test 4 passed: [1]             → [1]",
        "",
        "Performance benchmark (n=100,000):",
        `  Algorithm      : ${approachLabel}`,
        "  Execution time : 18ms",
        "  Memory usage   : 2.1MB",
        "  Complexity     : O(n log n) ✓",
        "",
        "All tests passed. ✓ Ready for deployment.",
      ],
      status: "success",
      timestamp: now(),
    }
  }

  if (codeState === "FIXED_SLOW") {
    return {
      lines: [
        "$ node production-sort.js",
        "Running test suite...",
        "",
        "✓  Test 1 passed: [8,5,2,9,1,12] → [1,2,5,8,9,12]",
        "✓  Test 2 passed: [100,3,7,55]   → [3,7,55,100]",
        "",
        "Performance benchmark (n=100,000):",
        "  Execution time : 4,823ms",
        "  Memory usage   : 0.8MB",
        "  Complexity     : O(n²) ⚠",
        "",
        "⚠  Warning: Performance constraint not met.",
        "   Client requires O(n log n). Current: O(n²).",
        "   Functional tests pass but performance tests FAIL.",
      ],
      status: "warning",
      timestamp: now(),
    }
  }

  if (codeState === "BUGGY_ORIGINAL") {
    return {
      lines: [
        "$ node production-sort.js",
        "Running test suite...",
        "",
        "✗  Test 1 FAILED:",
        "   Expected : [1,2,5,8,9,12]",
        "   Received : [1,2,5,8,9,undefined]",
        "",
        "TypeError: Cannot read properties of undefined",
        "    at sortInventory (production-sort.js:7:16)",
        "    at Object.<anonymous> (production-sort.js:14:13)",
        "",
        "Process exited with code 1",
      ],
      status: "error",
      timestamp: now(),
    }
  }

  if (codeState === "BUILT_IN_SORT") {
    return {
      lines: [
        "$ node production-sort.js",
        "Running test suite...",
        "",
        "✓  Tests passed.",
        "",
        "⚠  Code review note: Array.prototype.sort() is not permitted",
        "   for this module — audit trail compliance requires a custom",
        "   comparison-based O(n log n) implementation such as merge sort or quicksort.",
      ],
      status: "warning",
      timestamp: now(),
    }
  }

  return {
    lines: [
      "$ node production-sort.js",
      "Running...",
      "",
      "✗  Test 1 FAILED: Output does not match expected values.",
      "   Check your loop bounds, comparison logic, and whether the PM constraint needs O(n log n).",
      "",
      "Process exited with code 1",
    ],
    status: "error",
    timestamp: now(),
  }
}
