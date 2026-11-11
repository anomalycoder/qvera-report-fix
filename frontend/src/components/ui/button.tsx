import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#0B0F12] text-white shadow-xs hover:bg-[#1f2328]",
        primary:
          "bg-[#0B0F12] text-white shadow-xs hover:bg-[#1f2328]",
        destructive:
          "bg-[#B91C1C] text-white shadow-xs hover:bg-[#991B1B]",
        outline:
          "border border-[#CECECE] bg-white text-[#111111] shadow-2xs hover:bg-[#FAF9F5] hover:border-[#B5B5B5]",
        secondary:
          "bg-[#EAE7DC] text-[#111111] border border-[#D5D0C5] shadow-2xs hover:bg-[#DFDBD0]",
        ghost:
          "text-[#555555] hover:bg-[#EFECE6] hover:text-[#111111]",
        link:
          "text-[#111111] underline-offset-4 hover:underline",
        success:
          "bg-[#15803D] text-white shadow-xs hover:bg-[#166534]",
      },
      size: {
        default: "h-[40px] px-5 py-2 text-[13.5px]",
        sm: "h-9 rounded-[8px] px-3.5 text-xs font-medium",
        lg: "h-[44px] rounded-[8px] px-6 text-[14px] font-medium",
        icon: "h-9 w-9",
        iconSm: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
