import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border focus:outline-none select-none",
  {
    variants: {
      variant: {
        default:
          "border-[#DFDBD0] bg-[#EFECE6] text-[#222222]",
        secondary:
          "border-[#E2DFD6] bg-[#F9F8F3] text-[#555555]",
        outline:
          "border-[#DFDBD0] bg-white text-[#111111]",
        primary:
          "border-[#C5C1B4] bg-[#EAE7DC] text-[#111111]",
        success:
          "border-[#D1FADF] bg-[#ECFDF3] text-[#15803D]",
        warning:
          "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
        destructive:
          "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
        critical:
          "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] font-semibold",
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
