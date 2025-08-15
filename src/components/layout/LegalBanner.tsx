import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../i18n/i18n'

export function LegalBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const { t } = useI18n()

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-gradient-to-r from-amber-900/90 to-orange-900/90 border-b border-amber-700/50 backdrop-blur-sm"
        role="banner"
        aria-label="Advertencia legal"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 text-sm text-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-300 font-semibold">{t('legal.warning_title')}</span>
                <span className="px-2 py-0.5 bg-amber-800/50 rounded text-xs font-medium">{t('legal.demo_badge')}</span>
              </div>
              <p className="text-xs leading-relaxed">
                {t('legal.disclaimer')}
              </p>
              <p className="text-xs leading-relaxed mt-1">
                {t('legal.educational_use')}
              </p>
            </div>
                          <button
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0 text-amber-300 hover:text-amber-100 transition-colors p-1"
                aria-label={t('legal.close') as string}
              >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default LegalBanner
