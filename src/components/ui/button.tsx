import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] text-sm font-medium transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-pink-500 text-white hover:bg-brand-pink-600 shadow-[var(--shadow-glow-pink)]',
        gold: 'bg-brand-gold-400 text-brand-black-900 hover:bg-brand-gold-500',
        outline:
          'border border-[var(--border-subtle)] bg-transparent hover:bg-brand-pink-50 dark:hover:bg-white/5',
        ghost: 'bg-transparent hover:bg-brand-pink-50 dark:hover:bg-white/5',
        subtle: 'bg-brand-black-50 text-brand-black-800 hover:bg-brand-black-100 dark:bg-white/5 dark:text-white',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
