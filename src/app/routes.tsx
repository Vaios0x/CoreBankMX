import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { NetworkGuard } from '../components/layout/NetworkGuard'
import Dashboard from '../pages/Dashboard'
import Borrow from '../pages/Borrow'
import Repay from '../pages/Repay'
import Positions from '../pages/Positions'
import Liquidity from '../pages/Liquidity'
import Admin from '../pages/Admin'
import Docs from '../pages/Docs'
import DocsProtocol from '../pages/DocsProtocol'
import DocsApi from '../pages/DocsApi'
import DocsStatus from '../pages/DocsStatus'
import { AnimatePresence, motion } from 'framer-motion'
import Home from '../pages/Home'

function Page({ children }: { children: React.ReactNode }) {
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

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Home /></Page>} />
        <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
        <Route path="/borrow" element={<Page><Borrow /></Page>} />
        <Route path="/repay" element={<Page><Repay /></Page>} />
        <Route path="/positions" element={<Page><Positions /></Page>} />
        <Route path="/liquidity" element={<Page><Liquidity /></Page>} />
        <Route path="/admin" element={<Page><Admin /></Page>} />
        <Route path="/docs" element={<Page><Docs /></Page>} />
        <Route path="/docs/protocol" element={<Page><DocsProtocol /></Page>} />
        <Route path="/docs/api" element={<Page><DocsApi /></Page>} />
        <Route path="/docs/status" element={<Page><DocsStatus /></Page>} />
      </Routes>
    </AnimatePresence>
  )
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppShell>
        <NetworkGuard>
          <AnimatedRoutes />
        </NetworkGuard>
      </AppShell>
    </BrowserRouter>
  )
}

export default AppRoutes


