import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import cesium from 'vite-plugin-cesium'
import glsl from "vite-plugin-glsl"
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium(), glsl()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
