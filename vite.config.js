import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/town-generator-vite/',
  server: {
    allowedHosts: ['sunny-birch-ee4e.tunnl.gg'] // <-- add your remote host here
  }
})
