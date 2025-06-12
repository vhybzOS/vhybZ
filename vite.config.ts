import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { reactRouter } from "@react-router/dev/vite"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    reactRouter(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
