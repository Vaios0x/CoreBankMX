import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar advertencias de TypeScript durante el build
        if (warning.code === 'TS2307' || warning.code === 'TS6133' || warning.code === 'TS2322') {
          return
        }
        warn(warning)
      }
    }
  },
  optimizeDeps: {
    force: true,
    include: [
      '@rainbow-me/rainbowkit',
      '@rainbow-me/rainbowkit/wallets',
      'wagmi',
      'viem',
      'ethers',
    ],
  },
})
