import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Page } from '../components/layout/Page'
import Home from '../pages/Home'
import Dashboard from '../pages/Dashboard'
import Borrow from '../pages/Borrow'
import Repay from '../pages/Repay'
import Positions from '../pages/Positions'
import Liquidity from '../pages/Liquidity'
import Admin from '../pages/Admin'
import Docs from '../pages/Docs'
import DocsStatus from '../pages/DocsStatus'
import DocsApi from '../pages/DocsApi'
import DocsProtocol from '../pages/DocsProtocol'
import NotFound from '../pages/NotFound'
import { Remittances } from '../pages/Remittances'
import { OffRamp } from '../pages/OffRamp'
import { Settings } from '../pages/Settings'
import { Analytics } from '../pages/Analytics'

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
        <Route path="/remittances" element={<Page><Remittances /></Page>} />
        <Route path="/offramp" element={<Page><OffRamp /></Page>} />
        <Route path="/settings" element={<Page><Settings /></Page>} />
        <Route path="/analytics" element={<Page><Analytics /></Page>} />
        <Route path="/admin" element={<Page><Admin /></Page>} />
        <Route path="/docs" element={<Page><Docs /></Page>} />
        <Route path="/docs/status" element={<Page><DocsStatus /></Page>} />
        <Route path="/docs/api" element={<Page><DocsApi /></Page>} />
        <Route path="/docs/protocol" element={<Page><DocsProtocol /></Page>} />
        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
    </AnimatePresence>
  )
}

export { AnimatedRoutes }


