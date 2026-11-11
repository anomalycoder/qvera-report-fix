import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[38px] w-full rounded-[8px] border border-[#DFDBD0] bg-white px-3 py-1.5 text-[13px] text-[#111111] transition-colors placeholder:text-[#888888] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] focus-visible:border-[#111111] disabled:cursor-not-allowed disabled:opacity-50 font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
