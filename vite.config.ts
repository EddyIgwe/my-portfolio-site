import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';

/**
 * `npm run build`          production site in /dist (index.html + 404.html, prerendered)
 * `npm run build:preview`  one self-contained page in /dist-single (JS, CSS and fonts inlined)
 */
export default defineConfig(({ mode, isSsrBuild }) => {
  const single = mode === 'single';
  return {
    base: single ? './' : '/',
    // Shared by the client and server builds (Vite resets BASE_URL to '/' for SSR).
    define: { __ASSET_BASE__: JSON.stringify(single ? './' : '/') },
    plugins: [react(), ...(single && !isSsrBuild ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
    build: isSsrBuild
      ? { emptyOutDir: true }
      : {
          outDir: single ? 'dist-single' : 'dist',
          copyPublicDir: !single,
          emptyOutDir: true,
          rollupOptions: {
            input: (single
              ? { main: resolve(__dirname, 'index.html') }
              : { main: resolve(__dirname, 'index.html'), notFound: resolve(__dirname, '404.html') }) as Record<string, string>,
          },
        },
  };
});
