'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  // Determine border radius class name dynamically to ensure concentric inner mask curves
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

  // Ensure default radius class is present if no custom radius is specified in className
  const hasCustomRadius = className && /rounded-(3xl|2xl|xl|lg|md|sm|none)/.test(className)
  const defaultRadius = hasCustomRadius ? '' : 'rounded-2xl'

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 border-none p-6 shadow-lg duration-200 sm:max-w-lg overflow-hidden bg-slate-950/90 text-slate-100',
          defaultRadius,
          className,
        )}
        {...props}
      >
        {/* Rotating multi-color border overlay */}
        <div className={cn("absolute inset-0 z-0 pointer-events-none overflow-hidden", radiusClass)}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] aspect-square rounded-full bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[border-spin_6s_linear_infinite] z-0" />
          <div className={cn("absolute inset-[2px] bg-slate-950 z-10", innerRadiusClass)} />
        </div>

        {/* Children wrapper at z-20 */}
        <div className="relative z-20 w-full h-full flex flex-col justify-stretch">
          {children}
        </div>

        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background hover:text-red-400 focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 text-red-500 cursor-pointer z-30"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
