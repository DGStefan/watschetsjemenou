import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    host: true, // luister ook op je netwerk-IP, zodat andere apparaten erbij kunnen
    // In dev draait de client hier en praat met de server op poort 3000.
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
      },
    },
  },
});
