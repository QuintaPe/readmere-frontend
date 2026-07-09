import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Readmere",
        short_name: "Readmere",
        description: "Lectura de EPUBs con vocabulario inteligente y flashcards",
        lang: "es",
        theme_color: "#5b6cff",
        background_color: "#0b0b10",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Handler extra que sirve audiolibros de OPFS con soporte Range
        // (streaming en iPad). Se ejecuta dentro del SW generado por Workbox.
        importScripts: ["/opfs-sw.js"],
        navigateFallback: "/index.html",
        // La API y el audio de OPFS nunca deben caer en el fallback de navegación
        navigateFallbackDenylist: [/^\/api\//, /^\/opfs-audio\//],
        runtimeCaching: [
          {
            // EPUBs de Supabase Storage: pesados e inmutables → cache first
            urlPattern: /supabase\.co\/storage\/.*\/books\//,
            handler: "CacheFirst",
            options: {
              cacheName: "epubs",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Portadas de Open Library / Google Books
            urlPattern: /(covers\.openlibrary\.org|books\.google)/,
            handler: "CacheFirst",
            options: {
              cacheName: "covers",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Datos propios: red primero con timeout corto; si no hay red,
            // sirve la última copia para poder leer/repasar offline
            urlPattern: /\/api\/(words|books|decks|profiles|study-sessions)/,
            handler: "NetworkFirst",
            method: "GET",
            options: {
              cacheName: "api",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 8080,
  },
});
