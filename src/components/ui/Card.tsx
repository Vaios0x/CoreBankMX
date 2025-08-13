import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

type CardProps = { title?: string; children: ReactNode; footer?: ReactNode; className?: string }

export function Card({ title, children, footer, className }: CardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      whileHover={{ scale: 1.01 }}
      className={clsx('group relative overflow-hidden card transition-shadow hover:shadow-brand-glow', className)}
    >
      {/* subtle shine overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
      {title && <h2 className="text-sm font-medium text-gray-200">{title}</h2>}
      <div className={title ? 'mt-2' : ''}>{children}</div>
      {footer && <div className="mt-4 border-t border-gray-800 pt-3 text-sm text-gray-400">{footer}</div>}
    </motion.section>
  )
}

export default Card


