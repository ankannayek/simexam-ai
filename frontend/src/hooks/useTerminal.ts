import { useCallback, useState } from "react"
import { runCode } from "../lib/terminalPatterns"
import { TerminalOutput } from "../types/index"

export function useTerminal() {
  const [outputs, setOutputs] = useState<TerminalOutput[]>([
    {
      lines: ["SimExam terminal ready.", "Run the code to see the immediate result."],
      status: "idle",
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    },
  ])

  const executeCode = useCallback((code: string) => {
    const output = runCode(code)
    setOutputs((prev) => [...prev, output])
    return output
  }, [])

  const clearTerminal = useCallback(() => {
    setOutputs([
      {
        lines: ["Terminal cleared."],
        status: "idle",
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      },
    ])
  }, [])

  return {
    outputs,
    executeCode,
    clearTerminal,
  }
}