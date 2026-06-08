import { recordAgentEvent } from "../lib/db.js"

export interface ProactiveState {
  sessionId: string
  lastCodeChangeAt: number
  lastMessageAt: number
  timeElapsedSeconds: number
  curveballAtSeconds: number
  curveballFired: boolean
  hintGivenInLastMinute?: boolean
}

export function decideProactiveActions(state: ProactiveState): Array<"CODE_STALE" | "SILENCE_TIMEOUT" | "CURVEBALL"> {
  const now = Date.now()
  const actions: Array<"CODE_STALE" | "SILENCE_TIMEOUT" | "CURVEBALL"> = []

  if (now - state.lastCodeChangeAt > 90_000 && !state.hintGivenInLastMinute) {
    actions.push("CODE_STALE")
  }

  if (now - state.lastMessageAt > 120_000 && state.timeElapsedSeconds > 60) {
    actions.push("SILENCE_TIMEOUT")
  }

  if (state.timeElapsedSeconds >= state.curveballAtSeconds && !state.curveballFired) {
    actions.push("CURVEBALL")
  }

  return actions
}

export async function emitProactiveMessage(
  sessionId: string,
  action: "CODE_STALE" | "SILENCE_TIMEOUT" | "CURVEBALL",
  content: string
): Promise<void> {
  await recordAgentEvent({
    sessionId,
    eventType: action === "CURVEBALL" ? "curveball" : "proactive",
    actor: "agent",
    content,
    metadata: { action },
  })
}
