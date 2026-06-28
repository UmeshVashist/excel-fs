import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  const isAnimated = className?.includes('rainbow-animated-border')

  if (isAnimated) {
    const cleanClassName = className
      .replace('rainbow-animated-border', '')
      .replace(/\bbg-\S+/g, '')
      .replace(/\bbackdrop-blur\S*/g, '')
      .trim()

    // Determine border radius class name dynamically to ensure concentric inner card curves
    let radiusClass = 'rounded-2xl'
    let innerRadiusClass = 'rounded-[14px]'

    if (className?.includes('rounded-3xl')) {
      radiusClass = 'rounded-3xl'
      innerRadiusClass = 'rounded-[22px]'
    } else if (className?.includes('rounded-xl')) {
      radiusClass = 'rounded-xl'
      innerRadiusClass = 'rounded-[10px]'
    } else if (className?.includes('rounded-lg')) {
      radiusClass = 'rounded-lg'
      innerRadiusClass = 'rounded-[6px]'
    } else if (className?.includes('rounded-md')) {
      radiusClass = 'rounded-md'
      innerRadiusClass = 'rounded-[4px]'
    } else if (className?.includes('rounded-none')) {
      radiusClass = 'rounded-none'
      innerRadiusClass = 'rounded-none'
    }

    const hasCustomRadius = className && /rounded-(3xl|2xl|xl|lg|md|sm|none)/.test(className)
    const defaultRadius = hasCustomRadius ? '' : 'rounded-2xl'

    return (
      <div className={cn("relative overflow-hidden p-[2px] w-full h-full", defaultRadius, radiusClass)}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0 pointer-events-none" />
        <div
          data-slot="card"
          className={cn(
            'bg-slate-950 text-card-foreground flex flex-col gap-6 border border-white/10 py-6 shadow-sm relative z-10 w-full h-full',
            innerRadiusClass,
            cleanClassName,
          )}
          {...props}
        />
      </div>
    )
  }

  return (
    <div
      data-slot="card"
      className={cn(
        'bg-slate-950/20 text-card-foreground flex flex-col gap-6 rounded-xl border border-white/10 py-6 shadow-sm backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
