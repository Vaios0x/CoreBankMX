import type { ChangeEvent } from 'react'
import { motion } from 'framer-motion'

type SliderProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  marks?: number[]
  format?: (v: number) => string
}

export function Slider({ value, onChange, min = 0, max = 1, step = 0.01, label, marks = [], format }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))
  
  return (
    <div className="space-y-2 sm:space-y-3">
      {label && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm">
          <span className="text-gray-300">{label}</span>
          <motion.span 
            key={value} 
            initial={{ opacity: 0, y: -4 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.12 }} 
            className="font-medium text-gray-100 text-right"
          >
            {format ? format(value) : value.toFixed(2)}
          </motion.span>
        </div>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handle}
          aria-label={label}
          className="h-3 sm:h-2 w-full appearance-none rounded bg-ui-surface-muted accent-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        />
        <motion.div 
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2" 
          aria-hidden
          initial={false}
          animate={{}}
        >
          <div className="relative h-3 sm:h-2">
            <motion.div 
              layout 
              className="absolute left-0 top-0 h-3 sm:h-2 rounded bg-brand-600" 
              style={{ width: `${pct}%` }} 
            />
          </div>
        </motion.div>
      </div>
      
      {marks.length > 0 && (
        <div className="flex flex-wrap justify-between gap-1 sm:gap-2 text-xs text-gray-400">
          {marks.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className="rounded px-1 sm:px-2 py-1 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              aria-label={`Set to ${Math.round((m - min) / (max - min) * 100)}%`}
            >
              {format ? format(m) : m.toFixed(2)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Slider


