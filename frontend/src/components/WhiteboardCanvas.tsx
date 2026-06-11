import { Tldraw } from '@tldraw/tldraw'
import { BACKEND_URL } from '../lib/constants'
import '@tldraw/tldraw/tldraw.css'
import { useEffect, useRef } from 'react'

interface WhiteboardCanvasProps {
  value: string
  onChange: (val: string) => void
}

export function WhiteboardCanvas({ value, onChange }: WhiteboardCanvasProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      fetch(`${BACKEND_URL}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'proactive', action: 'SILENCE_TIMEOUT' })
      }).catch(err => console.error("Proactive agent error", err))
    }, 60000)
  }

  useEffect(() => {
    resetTimeout()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#161618] overflow-hidden relative">
      <Tldraw
        onMount={(editor) => {
          editor.store.listen(() => {
            const snapshot = (editor.store as any).getSnapshot
              ? (editor.store as any).getSnapshot()
              : (editor as any).getSnapshot
              ? (editor as any).getSnapshot()
              : {}
            onChange(JSON.stringify(snapshot))
            resetTimeout()
          }, { source: 'user', scope: 'document' })
        }}
      />
    </div>
  )
}
