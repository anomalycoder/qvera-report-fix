import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors border focus:outline-none select-none",
  {
    variants: {
      variant: {
        default:
          "border-[#E5E7EB] bg-slate-100 text-[#111827]",
        secondary:
          "border-[#E5E7EB] bg-slate-50 text-slate-700",
        outline:
          "border-[#E5E7EB] bg-white text-slate-800",
        primary:
          "border-blue-200 bg-blue-50 text-blue-700",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-800",
        critical:
          "border-rose-300 bg-rose-100 text-rose-900 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
