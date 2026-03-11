import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-router')) return 'vendor-react';
                        if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
                        if (id.includes('jspdf')) return 'vendor-pdf';
                        return 'vendor';
                    }
                }
            }
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5005',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:5005',
                changeOrigin: true,
            }
        }
    }
})
