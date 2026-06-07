import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "outline"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    success: "bg-green-500/15 text-green-300 border-green-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    error: "bg-red-500/15 text-red-300 border-red-500/30",
    outline: "bg-transparent text-zinc-300 border-zinc-700",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />
  )
}
