import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(), 
//     tsconfigPaths(),
//     createHtmlPlugin({
//       inject: {
//         data: {
//           title: 'memoire app'
//         }
//       }
//     })
//   ],
//   base: env.VITE_BASE_URL,
//   build: {
//     outDir: 'docs',
//     emptyOutDir: true
//   },
//   server: {
//     fs: {
//       strict: false
//     }
//   }
// })


export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения для текущего режима (development/production)
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(), 
      tsconfigPaths(),
      createHtmlPlugin({
        inject: {
          data: {
            title: 'memoire app'
          }
        }
      })
    ],
    base: env.VITE_BASE_URL,
    build: {
      outDir: 'docs',
      emptyOutDir: true
    },
    server: {
      fs: {
        strict: false
      }
    }
  };
});