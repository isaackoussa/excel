import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // exceljs (≈ 900 ko) n'est chargé qu'au téléchargement d'un fichier.
    chunkSizeWarningLimit: 1000,
  },
})
