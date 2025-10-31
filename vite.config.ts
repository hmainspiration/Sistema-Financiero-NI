import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
        base: '/Sistema-Financiero-NI/
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Fix: Se reemplazó `process.cwd()` con `.` para solucionar un error de tipo en TypeScript. `path.resolve('.')` sigue resolviendo correctamente a la raíz del proyecto.
          '@': path.resolve('.'),
        }
      }
    };
});
