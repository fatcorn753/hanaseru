/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages のサブパスで配信するときは BASE_PATH=/hanaseru/ を渡す
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "dev") },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "はなせる — 会話の行動実験ノート",
        short_name: "はなせる",
        description: "会話への恐れを、行動実験で少しずつほどく練習アプリ",
        lang: "ja",
        theme_color: "#2f6f5e",
        background_color: "#f7f5f0",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
    setupFiles: ["src/test-setup.ts"],
  },
});
