import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

interface WhiteboardCanvasProps {
  value: string
  onChange: (val: string) => void
}

export function WhiteboardCanvas({ value, onChange }: WhiteboardCanvasProps) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#161618] overflow-hidden relative">
      <Tldraw
        onMount={(editor) => {
          editor.store.listen(() => {
            const snapshot = editor.store.getSnapshot()
            onChange(JSON.stringify(snapshot))
          }, { source: 'user', scope: 'document' })
        }}
      />
    </div>
  )
}
