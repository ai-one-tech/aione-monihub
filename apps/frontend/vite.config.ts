import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { codeInspectorPlugin } from 'code-inspector-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
     codeInspectorPlugin({
      bundler: 'vite',
      showSwitch:true
    }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 开发环境代理配置，解决CORS问题
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
