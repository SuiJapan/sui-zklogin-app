import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  plugins: [react()],
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      "/hkdf": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
}));
