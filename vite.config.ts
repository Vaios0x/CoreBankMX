import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
