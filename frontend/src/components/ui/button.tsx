import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-indigo-500 text-white hover:bg-indigo-400",
      outline: "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-900",
      ghost: "bg-transparent text-zinc-300 hover:bg-zinc-900",
      danger: "bg-red-500 text-white hover:bg-red-400",
    }
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
