import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Release-nummer: enige bron van waarheid is de root-package.json.
const rootPkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
);

// Build-detail: Coolify geeft de commit mee als build-arg SOURCE_COMMIT.
// Niet gezet (bijv. lokale dev) -> lege string, dan toont de footer geen hash.
const gitSha = (process.env.SOURCE_COMMIT ?? "").trim().slice(0, 7);

export default defineConfig({
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(rootPkg.version),
    __GIT_SHA__: JSON.stringify(gitSha),
  },
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
