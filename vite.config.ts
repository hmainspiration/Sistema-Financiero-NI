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
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      // This is crucial for environments that might accidentally load two different
      // versions of React (e.g., one from a CDN via importmap, another from node_modules
      // by a build tool plugin). `dedupe` forces Vite to always resolve these
      // dependencies to the same module, fixing the "Objects are not valid as a React child"
      // error that occurs when a component created with one React instance is rendered
      // by another.
      resolve: {
        dedupe: ['react', 'react-dom'],
      },
    };
});