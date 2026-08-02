import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        pink: 'bg-brand-pink-100 text-brand-pink-700',
        gold: 'bg-brand-gold-100 text-brand-gold-700',
        neutral: 'bg-brand-black-100 text-brand-black-700 dark:bg-white/10 dark:text-white',
        danger: 'bg-red-100 text-red-700',
        success: 'bg-emerald-100 text-emerald-700',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
