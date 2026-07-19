import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:cursor-pointer backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-[#FAEBD7] text-slate-800 border border-[#e3d3be] shadow-[4px_4px_8px_rgba(180,165,145,0.4),_-4px_-4px_8px_rgba(255,255,255,0.9)] hover:bg-[#ebdcc8] hover:shadow-[5px_5px_10px_rgba(180,165,145,0.55),_-5px_-5px_10px_rgba(255,255,255,0.95)] active:shadow-[inset_2px_2px_4px_rgba(180,165,145,0.5),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-[#FAEBD7]/40 border-[#e3d3be] shadow-xs hover:bg-[#FAEBD7] hover:text-slate-800",
        secondary: "bg-[#FAEBD7] text-slate-800 border border-[#e3d3be] hover:bg-[#ebdcc8]/80",
        ghost: "hover:bg-[#FAEBD7]/30 hover:text-slate-800",
        link: "text-slate-800 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
