import type { ReactNode } from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'default'

export function Badge({ variant = 'default', children, className }: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  const classesByVariant: Record<BadgeVariant, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    default: 'badge',
  }
  return <span className={clsx(classesByVariant[variant], className)}>{children}</span>
}

export default Badge


