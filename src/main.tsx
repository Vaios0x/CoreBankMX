import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppProviders } from './app/providers'
import { AnimatedRoutes } from './app/routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AnimatedRoutes />
    </AppProviders>
  </StrictMode>,
)
