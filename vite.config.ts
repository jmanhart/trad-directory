import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { version } from "./package.json";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
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
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
