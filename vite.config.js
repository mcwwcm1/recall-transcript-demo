import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls to Recall.ai
      "/api": {
        target: "https://us-west-2.recall.ai",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api/v1"),
      },
      // Proxy SSE endpoint to our Express server
      "/events": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
