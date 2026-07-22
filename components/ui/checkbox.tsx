'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-slate-700/80 bg-slate-950/60 backdrop-blur-md data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-cyan-500 data-[state=checked]:to-blue-600 data-[state=checked]:border-cyan-400 data-[state=checked]:text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] focus-visible:border-cyan-400 focus-visible:ring-cyan-500/30 size-4.5 shrink-0 rounded-md border transition-all duration-200 outline-none hover:border-cyan-500/60 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-white transition-transform duration-200 scale-100 data-[state=unchecked]:scale-0"
      >
        <CheckIcon className="size-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
