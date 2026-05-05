import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@design-system": path.resolve(__dirname, "../design-system/src"),
      "@": path.resolve(__dirname, "../../client/monitoring/src"),
    },
  },
});
