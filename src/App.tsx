import { AppProviders } from './app/providers'
import { AnimatedRoutes } from './app/routes'
import { InstallPrompt, ConnectionStatus, UpdatePrompt } from './components/pwa/InstallPrompt'

export default function App() {
  return (
    <AppProviders>
      <AnimatedRoutes />
      {/* Componentes PWA */}
      <InstallPrompt />
      <ConnectionStatus />
      <UpdatePrompt />
    </AppProviders>
  )
}
