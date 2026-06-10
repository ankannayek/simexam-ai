import { useCallback } from "react"
import SimpleMdeReact from "react-simplemde-editor"
import "easymde/dist/easymde.min.css"

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  onSubmit?: () => void
}

export function RichTextEditor({ value, onChange, onSubmit }: RichTextEditorProps) {
  const handleChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#161618] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-medium text-zinc-400">Essay Editor</span>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-auto prose-invert">
        <SimpleMdeReact
          value={value}
          onChange={handleChange}
          options={{
            spellChecker: false,
            status: false,
            placeholder: "Write your answer here... Markdown is supported.",
          }}
        />
      </div>
    </div>
  )
}
