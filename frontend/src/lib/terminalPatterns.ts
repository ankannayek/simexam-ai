import { TerminalOutput } from "../types/index"
import { deriveCodeState } from "./codeAnalysis"

function now(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}

function successOutput(): TerminalOutput {
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
      "  Execution time : 18ms",
      "  Memory usage   : 2.1MB",
      "  Complexity     : O(n log n) ✓",
      "",
      "All tests passed. Ready for deployment.",
    ],
    status: "success",
    timestamp: now(),
  }
}

function warningOutput(): TerminalOutput {
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
      "Warning: Performance constraint not met.",
      "Client requires O(n log n). Functional tests pass but performance tests fail.",
    ],
    status: "warning",
    timestamp: now(),
  }
}

function buggyOutput(): TerminalOutput {
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

function builtinSortOutput(): TerminalOutput {
  return {
    lines: [
      "$ node production-sort.js",
      "Running test suite...",
      "",
      "✓  Tests passed.",
      "",
      "Code review note: Array.prototype.sort() is not permitted for this module.",
      "Please implement a custom O(n log n) approach.",
    ],
    status: "warning",
    timestamp: now(),
  }
}

function defaultOutput(): TerminalOutput {
  return {
    lines: [
      "$ node production-sort.js",
      "Running...",
      "",
      "Output does not match the expected result.",
      "Check your loop bounds, comparison logic, and array writes.",
      "",
      "Process exited with code 1",
    ],
    status: "error",
    timestamp: now(),
  }
}

export function runCode(code: string): TerminalOutput {
  const codeState = deriveCodeState(code)

  switch (codeState) {
    case "FIXED_FAST":
      return successOutput()
    case "FIXED_SLOW":
      return warningOutput()
    case "BUGGY_ORIGINAL":
      return buggyOutput()
    case "BUILT_IN_SORT":
      return builtinSortOutput()
    default:
      return defaultOutput()
  }
}