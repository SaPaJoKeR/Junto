import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        outline: 'border border-current bg-transparent',
        success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        confirmed: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm',
        proposal: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
