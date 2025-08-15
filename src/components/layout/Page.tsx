import React from 'react'
import { motion } from 'framer-motion'

interface PageProps {
  children: React.ReactNode
}

export function Page({ children }: PageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
