"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { ChatMessage, GeminiMessage, ExamState } from "../types/index"
import { streamChat } from "../lib/api"
import { generateId } from "../lib/utils"
import { CURVEBALL_MESSAGE, SIMULATOR_OPENING_MESSAGE } from "../lib/constants"

export function useChat(studentName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: "simulator",
      content: SIMULATOR_OPENING_MESSAGE(studentName || "Candidate"),
      timestamp: Date.now(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [curveballFired, setCurveballFired] = useState(false)
  const curveballRef = useRef(false)
  const codeSnapshotsRef = useRef<string[]>([])
  const studentNameRef = useRef(studentName || "Candidate")

  useEffect(() => {
    if (!studentName || studentNameRef.current === studentName) return
    studentNameRef.current = studentName
    setMessages(prev => {
      const [first, ...rest] = prev
      if (!first || first.role !== "simulator") return prev
      return [{ ...first, content: SIMULATOR_OPENING_MESSAGE(studentName) }, ...rest]
    })
  }, [studentName])

  const addCodeSnapshot = useCallback((code: string) => {
    if (!codeSnapshotsRef.current.includes(code)) {
      codeSnapshotsRef.current.push(code)
    }
  }, [])

  const injectCurveball = useCallback(() => {
    if (curveballRef.current) return
    curveballRef.current = true
    setCurveballFired(true)

    const curveballMsg: ChatMessage = {
      id: generateId(),
      role: "pm",
      content: CURVEBALL_MESSAGE,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, curveballMsg])
  }, [])

  const sendMessage = useCallback(async (
    userText: string,
    examState: ExamState,
    currentCode: string
  ) => {
    if (!userText.trim() || isTyping) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "student",
      content: userText,
      timestamp: Date.now(),
    }

    const assistantId = generateId()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "simulator",
      content: "",
      timestamp: Date.now(),
      streaming: true,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsTyping(true)
    addCodeSnapshot(currentCode)

    const allMessages = [...messages, userMsg]
    const geminiHistory: GeminiMessage[] = allMessages
      .filter(m => m.role === "student" || m.role === "simulator" || m.role === "pm")
      .map(m => ({
        role: (m.role === "student" || m.role === "pm") ? "user" as const : "model" as const,
        parts: [{ text: m.role === "pm" ? `[PM_ALEX] ${m.content}` : m.content }],
      }))

    await streamChat(
      geminiHistory,
      studentNameRef.current,
      examState,
      (text) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: m.content + text, streaming: true }
              : m
          )
        )
      },
      () => {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m))
        setIsTyping(false)
      },
      (err) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: err, streaming: false, isError: true }
              : m
          )
        )
        setIsTyping(false)
      }
    )
  }, [messages, isTyping, addCodeSnapshot])

  const getCodeSnapshots = useCallback(() => [...codeSnapshotsRef.current], [])

  const buildTranscript = useCallback((): string => {
    return messages
      .map(m => {
        const label =
          m.role === "student" ? `Student (${studentNameRef.current})`
          : m.role === "simulator" ? "Senior Dev (Alex Chen)"
          : m.role === "pm" ? "PM (Alex)"
          : "System"
        return `${label}: ${m.content}`
      })
      .join("\n\n")
  }, [messages])

  return {
    messages,
    isTyping,
    curveballFired,
    injectCurveball,
    sendMessage,
    buildTranscript,
    addCodeSnapshot,
    getCodeSnapshots,
    codeSnapshotsRef,
  }
}
