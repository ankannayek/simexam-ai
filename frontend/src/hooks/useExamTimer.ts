import { useEffect, useRef, useState } from "react"
import { EXAM_DURATION_SECONDS, CURVEBALL_TRIGGER_SECONDS } from "../lib/constants"

interface UseExamTimerOptions {
  onCurveball: () => void
  onExpire: () => void
  autoStart?: boolean
}

export function useExamTimer({ onCurveball, onExpire, autoStart = true }: UseExamTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS)
  const [running, setRunning] = useState(autoStart)
  const [curveballFired, setCurveballFired] = useState(false)
  const curveballRef = useRef(false)
  const onCurveballRef = useRef(onCurveball)
  const onExpireRef = useRef(onExpire)

  useEffect(() => { onCurveballRef.current = onCurveball }, [onCurveball])
  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  useEffect(() => {
    if (!running) return

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1
        const elapsed = EXAM_DURATION_SECONDS - next

        if (elapsed === CURVEBALL_TRIGGER_SECONDS && !curveballRef.current) {
          curveballRef.current = true
          setCurveballFired(true)
          setTimeout(() => onCurveballRef.current(), 0)
        }

        if (next <= 0) {
          clearInterval(interval)
          setRunning(false)
          setTimeout(() => onExpireRef.current(), 0)
          return 0
        }

        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [running])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.shiftKey && e.key.toLowerCase() === "d" && !curveballRef.current) {
        curveballRef.current = true
        setCurveballFired(true)
        onCurveballRef.current()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return {
    secondsLeft,
    curveballFired,
    running,
    formatTime: (s: number) => {
      const m = Math.floor(s / 60)
      const sec = s % 60
      return `${m}:${String(sec).padStart(2, "0")}`
    },
  }
}
