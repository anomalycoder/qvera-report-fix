import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium transition-colors border focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 bg-slate-100 text-slate-800",
        secondary:
          "border-slate-200 bg-slate-50 text-slate-600",
        outline:
          "border-slate-200 bg-white text-slate-700",
        primary:
          "border-blue-200 bg-blue-50 text-blue-700",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
        critical:
          "border-rose-300 bg-rose-100 text-rose-900 font-semibold",
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
