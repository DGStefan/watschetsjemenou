import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  // De shared-package is TypeScript-broncode; die bundelen we mee.
  // express/socket.io blijven external (komen uit node_modules).
  noExternal: [/@krabbelketen\/shared/],
});
