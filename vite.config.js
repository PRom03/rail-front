import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api-proxy': {
        target: 'https://secure.snd.payu.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api-proxy/, ''),
        //secure: false, // ignoruje certyfikat SSL PayU sandbox
        //followRedirects: true, // jeśli node-proxy tego wymaga
      },
    },
  },
});
