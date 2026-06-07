import { useState, useCallback } from "react"
import { TerminalOutput } from "../types/index"
import { runCode } from "../lib/terminalPatterns"

export function useTerminal() {
  const [outputs, setOutputs] = useState<TerminalOutput[]>([
    {
      lines: ["SimExam.ai terminal ready.", "Click 'Run →' to execute your code."],
      status: "idle",
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    },
  ])

  const executeCode = useCallback((code: string) => {
    const output = runCode(code)
    setOutputs(prev => [...prev, output])
    return output
  }, [])

  const clearTerminal = useCallback(() => {
    setOutputs([{
      lines: ["Terminal cleared."],
      status: "idle",
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    }])
  }, [])

  return { outputs, executeCode, clearTerminal }
}
