import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { version } from "./package.json";
import path from "path";

// `/api` is served by `vercel dev` (started via `npm run dev:admin`), NOT Vite.
// The proxy target below and `vercel dev --listen` in package.json both read
// API_PORT (default 3001) so the two can never drift onto different ports.
const API_PORT = Number(process.env.API_PORT) || 3001;

// https://vite.dev/config/
export default defineConfig({
  // Isolate the optimize-deps cache per instance. `npm run dev:admin` runs two
  // Vite servers (app on 5173, plus the one vercel dev spawns on 3001); sharing
  // one cache makes each see the other's fingerprint as "config changed" and
  // re-optimize in a loop -> 504 Outdated Optimize Dep. The API server sets
  // VITE_CACHE_DIR to a separate path so the two never fight.
  cacheDir: process.env.VITE_CACHE_DIR || "node_modules/.vite",
  plugins: [
    react(),
    svgr(),
    nodePolyfills({
      include: ["util", "buffer", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // Only include Sentry plugin if auth token is available
    process.env.SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: "tattoo-directory",
        project: "javascript-react",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: {
          name: `tattoo-directory@${version}`,
        },
        sourcemaps: {
          assets: ["./dist/**"],
        },
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  build: {
    sourcemap: true,
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
  esbuild: {
    pure: ["console.log", "console.warn"],
  },
  define: {
    __SENTRY_RELEASE__: JSON.stringify(`tattoo-directory@${version}`),
    global: "globalThis",
    "process.env": {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    },
  },
  optimizeDeps: {
    include: ["@sentry/react"],
  },
  server: {
    force: true, // Re-optimize deps on start; avoids 504 Outdated Optimize Dep
    proxy: {
      "/api": {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        secure: false,
        // Fail LOUD instead of silently returning empty data: if nothing is
        // listening on the API port, the app used to just render with no data
        // and no error. This prints an actionable message on the first failed
        // /api request instead.
        configure: proxy => {
          proxy.on("error", err => {
            if ((err as NodeJS.ErrnoException).code === "ECONNREFUSED") {
              console.error(
                `\n\x1b[41m\x1b[97m API PROXY \x1b[0m Nothing is listening on ` +
                  `http://localhost:${API_PORT} — /api requests are failing, so the ` +
                  `app will load with no data.\n` +
                  `  Start the API with \x1b[1mnpm run dev:admin\x1b[0m ` +
                  `(plain \x1b[1mnpm run dev\x1b[0m does NOT serve /api).\n`
              );
            }
          });
        },
      },
    },
  },
});
