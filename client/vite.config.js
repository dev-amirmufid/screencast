// import path from 'path'
import { defineConfig,loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({command, mode}) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // vite config
    define: {
      env,
    },
    server: {
      host: true,
      port: 80,
      https: false
    },
    preview: {
      port: 80,
      https: false,
      cors: false,
    },
    plugins: [react()],
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment'
    }
  

  }
})
