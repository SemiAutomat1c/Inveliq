import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva('iq-button', {
  variants: {
    variant: {
      default: 'iq-button--default',
      secondary: 'iq-button--secondary',
      ghost: 'iq-button--ghost',
      outline: 'iq-button--outline',
      icon: 'iq-button--icon',
    },
    size: {
      sm: 'iq-button--sm',
      md: 'iq-button--md',
      lg: 'iq-button--lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)

Button.displayName = 'Button'
