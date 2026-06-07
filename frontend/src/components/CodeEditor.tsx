"use client"

import { Check, Copy, Play } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  onRun: () => void
  onSubmit: () => void
  onCopy?: () => void
}

export function CodeEditor({
  code,
  onChange,
  onRun,
  onSubmit,
  onCopy,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false)

  const lines = useMemo(() => code.split("\n"), [code])
  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(lines.length, 1) }, (_, index) => index + 1),
    [lines.length]
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      onCopy?.()
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // Ignore copy failures.
    }
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.035]">
      <CardHeader className="border-b border-white/8 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Code workspace</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Fix the broken sort, explain your thinking when needed, and improve the approach after the
              requirement changes.
            </p>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-zinc-400 sm:block">
            production-sort.js
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="overflow-hidden rounded-3xl border border-white/8 bg-zinc-950/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-xs text-zinc-500">
            <span className="font-medium tracking-[0.14em]">PRODUCTION-SORT.JS</span>
            <span className="font-mono">Ln 1, Col 1</span>
          </div>

          <div className="flex min-h-[520px]">
            <div className="hidden w-14 shrink-0 border-r border-white/8 bg-white/[0.015] px-3 py-4 font-mono text-xs leading-7 text-zinc-600 sm:block">
              {lineNumbers.map((line) => (
                <div key={line} className="h-7 text-right">
                  {line}
                </div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={(event) => onChange(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="min-h-[520px] flex-1 resize-none bg-transparent px-4 py-4 font-mono text-[14px] leading-7 text-zinc-100 outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-5 text-zinc-500">
            <div>Ctrl+Enter runs the current code.</div>
            <div>Use the chat for explanations, hints, and clarifications.</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" onClick={onRun}>
              <Play size={15} />
              Run
            </Button>
            <Button onClick={onSubmit}>Submit assessment</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}