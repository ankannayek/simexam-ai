"use client"

import { useState } from "react"
import {
  ArrowRight,
  Bot,
  Code2,
  LayoutPanelLeft,
  MessageSquareText,
  TimerReset,
  Sparkles,
  ShieldCheck,
  SquareTerminal,
} from "lucide-react"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { SESSION_KEYS } from "../lib/constants"
import { navigateTo } from "../lib/navigation"

function resetSession() {
  const keys = [
    SESSION_KEYS.STUDENT_NAME,
    SESSION_KEYS.EXAM_STATE,
    SESSION_KEYS.MESSAGES,
    SESSION_KEYS.CODE,
    SESSION_KEYS.TIMER,
    SESSION_KEYS.RESULTS,
    SESSION_KEYS.EVALUATION_PAYLOAD,
    SESSION_KEYS.EVALUATION_PENDING,
  ]

  for (const key of keys) {
    sessionStorage.removeItem(key)
  }
}

export default function LandingPage() {
  const [name, setName] = useState("")

  function begin() {
    const clean = name.trim() || "Candidate"
    sessionStorage.setItem(SESSION_KEYS.STUDENT_NAME, clean)
    resetSession()
    sessionStorage.setItem(SESSION_KEYS.STUDENT_NAME, clean)
    navigateTo("/exam")
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,131,255,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.07),transparent_20%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.5),transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex items-center justify-between gap-4">
          <Badge variant="outline" className="border-white/12 bg-white/[0.03] text-zinc-300">
            AI-DRIVEN PRACTICAL ASSESSMENTS
          </Badge>
          <span className="hidden text-xs text-zinc-500 sm:block">
            Clean interface • live demo ready • structured scoring
          </span>
        </header>

        <section className="flex flex-1 items-center py-10 lg:py-14">
          <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="space-y-8">
              <div className="max-w-2xl space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium tracking-[0.12em] text-indigo-200">
                  <Sparkles size={13} />
                  LIVE CANDIDATE SIMULATION
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.06em] text-zinc-50 sm:text-6xl lg:text-7xl">
                    SimExam.ai
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                    A focused assessment environment that tests debugging, reasoning, and adaptation under changing
                    constraints. One task. One interviewer. One structured evaluation.
                  </p>
                </div>
              </div>

              <Card className="overflow-hidden border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">Begin assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="max-w-xl text-sm leading-6 text-zinc-400">
                    You will enter a coding session with a broken module, a live mentor, a terminal, and a timed
                    constraint shift. The interface stays calm; the problem gets harder.
                  </p>

                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault()
                      begin()
                    }}
                  >
                    <label className="block text-[11px] font-medium tracking-[0.16em] text-zinc-500">
                      STUDENT NAME
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoFocus
                      className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                    />

                    <Button type="submit" className="h-12 w-full rounded-2xl text-sm">
                      Begin assessment <ArrowRight size={16} />
                    </Button>
                  </form>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">
                      Press Enter to start
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">
                      Session resets cleanly
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">
                      No clutter on this screen
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Code2,
                    title: "Code editor",
                    desc: "Broken code to inspect, fix, and improve.",
                  },
                  {
                    icon: MessageSquareText,
                    title: "AI interviewer",
                    desc: "A guided conversation that reacts to your answers.",
                  },
                  {
                    icon: SquareTerminal,
                    title: "Terminal output",
                    desc: "Immediate feedback from running the code.",
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <Card key={item.title} className="border-white/8 bg-white/[0.025]">
                      <CardContent className="space-y-3 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-indigo-200">
                          <Icon size={18} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-zinc-100">{item.title}</h3>
                          <p className="text-sm leading-6 text-zinc-500">{item.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-white/10 bg-white/[0.035]">
                <CardHeader className="space-y-3">
                  <Badge variant="outline" className="w-fit border-white/10 bg-white/[0.03]">
                    WHAT THE CANDIDATE SEES
                  </Badge>
                  <CardTitle className="text-xl sm:text-2xl">A professional coding-session flow</CardTitle>
                  <p className="max-w-xl text-sm leading-6 text-zinc-400">
                    The UI should feel like a serious assessment tool, not a toy dashboard. The hierarchy stays clean
                    and the story stays readable.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      icon: LayoutPanelLeft,
                      title: "Clear workspace",
                      desc: "Code on one side, conversation on the other, terminal below.",
                    },
                    {
                      icon: Bot,
                      title: "Real conversation",
                      desc: "The mentor responds to help requests and code changes.",
                    },
                    {
                      icon: TimerReset,
                      title: "Timed pressure",
                      desc: "A clean constraint shift appears mid-session without visual noise.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Structured evaluation",
                      desc: "A concise report summarizes technical accuracy and adaptability.",
                    },
                  ].map((item, index) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title}>
                        <div className="flex items-start gap-4 rounded-2xl border border-white/8 bg-zinc-950/55 px-4 py-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-indigo-200">
                            <Icon size={16} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
                            <p className="text-sm leading-6 text-zinc-500">{item.desc}</p>
                          </div>
                        </div>
                        {index < 3 && <Separator className="my-3 bg-white/8" />}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="border-indigo-500/15 bg-gradient-to-br from-indigo-500/8 via-white/[0.03] to-transparent">
                <CardContent className="space-y-3 p-5">
                  <div className="text-[11px] font-medium tracking-[0.16em] text-zinc-500">
                    PRODUCT PRINCIPLE
                  </div>
                  <p className="text-sm leading-7 text-zinc-300">
                    Public UI stays minimal and serious. Internal AI routing, evaluation details, and debug state live
                    behind the scenes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}