import { useEffect, useRef, useState } from "react"
import { CURVEBALL_TRIGGER_SECONDS, EXAM_DURATION_SECONDS } from "../lib/constants"
import { formatTime } from "../lib/utils"

interface UseExamTimerOptions {
  onCurveball: () => void
  onExpire: () => void
  autoStart?: boolean
}

export function useExamTimer({
  onCurveball,
  onExpire,
  autoStart = true,
}: UseExamTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS)
  const [running, setRunning] = useState(autoStart)
  const [curveballFired, setCurveballFired] = useState(false)

  const curveballRef = useRef(false)
  const onCurveballRef = useRef(onCurveball)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onCurveballRef.current = onCurveball
  }, [onCurveball])

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!running) return

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1
        const elapsed = EXAM_DURATION_SECONDS - next

        if (elapsed === CURVEBALL_TRIGGER_SECONDS && !curveballRef.current) {
          curveballRef.current = true
          setCurveballFired(true)
          window.setTimeout(() => onCurveballRef.current(), 0)
        }

        if (next <= 0) {
          window.clearInterval(interval)
          setRunning(false)
          window.setTimeout(() => onExpireRef.current(), 0)
          return 0
        }

        return next
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [running])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.shiftKey && event.key.toLowerCase() === "d" && !curveballRef.current) {
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
    running,
    curveballFired,
    formattedTime: formatTime(secondsLeft),
  }
}