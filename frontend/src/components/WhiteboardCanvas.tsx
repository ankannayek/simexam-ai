interface WhiteboardCanvasProps {
  value: string
  onChange: (val: string) => void
}

export function WhiteboardCanvas({ value, onChange }: WhiteboardCanvasProps) {
  // In a real application, this would embed tldraw, excalidraw, or a custom canvas
  // For now, we provide a placeholder indicating where the canvas goes.
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#161618] p-8 text-center">
      <div className="rounded-full bg-white/5 p-4 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
          <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
          <path d="M2 2l7.586 7.586"></path>
          <circle cx="11" cy="11" r="2"></circle>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-zinc-200">System Design Canvas</h3>
      <p className="mt-2 text-sm text-zinc-400 max-w-sm">
        The interactive whiteboard canvas will render here, allowing candidates to draw system architectures, sequence diagrams, and flowcharts.
      </p>
      
      {/* Hidden textarea to maintain state contract for now */}
      <textarea 
        className="hidden" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  )
}
