import type { ReactNode } from 'react'
import clsx from 'clsx'

export type AlertVariant = 'success' | 'warning' | 'danger'

export function Alert({
  variant,
  children,
  className,
  role = 'status',
  ariaLive = 'polite',
}: {
  variant: AlertVariant
  children: ReactNode
  className?: string
  role?: 'status' | 'alert'
  ariaLive?: 'polite' | 'assertive' | 'off'
}) {
  const classesByVariant: Record<AlertVariant, string> = {
    success: 'alert-success',
    warning: 'alert-warning',
    danger: 'alert-danger',
  }
  return (
    <div className={clsx(classesByVariant[variant], className)} role={role} aria-live={ariaLive}>
      {children}
    </div>
  )
}

export default Alert


