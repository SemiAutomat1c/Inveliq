import * as React from 'react'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import { cn } from '../../lib/utils'
import { Button } from './button'

export function AlertDialog(props: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root {...props} />
}

export function AlertDialogTrigger(props: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger {...props} />
}

export function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="iq-dialog-overlay" />
      <AlertDialogPrimitive.Content className={cn('iq-alert-dialog', className)} {...props} />
    </AlertDialogPrimitive.Portal>
  )
}

export const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('iq-alert-dialog__header', className)} {...props} />
)
export const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('iq-alert-dialog__footer', className)} {...props} />
)
export function AlertDialogTitle(props: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title {...props} />
}

export function AlertDialogDescription(props: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description {...props} />
}

export function AlertDialogCancel(props: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel asChild><Button variant="secondary" {...props} /></AlertDialogPrimitive.Cancel>
}

export function AlertDialogAction(props: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action asChild><Button className="iq-button--danger" {...props} /></AlertDialogPrimitive.Action>
}
