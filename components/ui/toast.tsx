'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitive.Provider
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: 'default' | 'success' | 'error' }
>(({ className, variant = 'default', ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border p-4 shadow-xl transition-all',
      'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
      'data-[state=open]:animate-slide-up data-[state=closed]:opacity-0',
      {
        'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700': variant === 'default',
        'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800': variant === 'success',
        'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800': variant === 'error',
      },
      className
    )}
    {...props}
  />
))
Toast.displayName = ToastPrimitive.Root.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-xs text-muted-foreground', className)} {...props} />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 transition-opacity', className)}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose }

// Simple hook for toast notifications
type ToastOptions = {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
  duration?: number
}

type ToastFn = (opts: ToastOptions) => void

const ToastContext = React.createContext<ToastFn>(() => {})

export function useToast() {
  return React.useContext(ToastContext)
}

// children нужны чтобы Toaster мог оборачивать всё приложение и предоставлять контекст
export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastOptions & { id: string; open: boolean })[]>([])

  const toast: ToastFn = React.useCallback((opts) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...opts, id, open: true }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, (opts.duration ?? 4000) + 300)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      <ToastProvider>
        {children}
        {toasts.map(t => (
          <Toast key={t.id} open={t.open} variant={t.variant}>
            <div className="flex-1 min-w-0">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}
