import { Routes, Route } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
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
  return (
    <Routes>
      <Route path="/" element={<AppShell><Home /></AppShell>} />
      <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
      <Route path="/borrow" element={<AppShell><Borrow /></AppShell>} />
      <Route path="/repay" element={<AppShell><Repay /></AppShell>} />
      <Route path="/positions" element={<AppShell><Positions /></AppShell>} />
      <Route path="/liquidity" element={<AppShell><Liquidity /></AppShell>} />
      <Route path="/remittances" element={<AppShell><Remittances /></AppShell>} />
      <Route path="/offramp" element={<AppShell><OffRamp /></AppShell>} />
      <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
      <Route path="/analytics" element={<AppShell><Analytics /></AppShell>} />
      <Route path="/admin" element={<AppShell><Admin /></AppShell>} />
      <Route path="/docs" element={<AppShell><Docs /></AppShell>} />
      <Route path="/docs/status" element={<AppShell><DocsStatus /></AppShell>} />
      <Route path="/docs/api" element={<AppShell><DocsApi /></AppShell>} />
      <Route path="/docs/protocol" element={<AppShell><DocsProtocol /></AppShell>} />
      <Route path="*" element={<AppShell><NotFound /></AppShell>} />
    </Routes>
  )
}

export { AnimatedRoutes }


