import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { SocketServer, type GameServer } from "./SocketServer";
import { config } from "./config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// In productie serveert de server de gebouwde Svelte-client.
// (In dev draait de client apart op Vite met een proxy naar deze server.)
const clientDir = process.env.CLIENT_DIR || resolve(__dirname, "../../client/dist");

const app = express();
app.use(express.static(clientDir));
// SPA-fallback: alles wat geen bestand is, krijgt index.html.
app.get("*", (_req, res) => {
  res.sendFile(resolve(clientDir, "index.html"));
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  maxHttpBufferSize: 5e6, // ruimer, want tekeningen gaan als data-URL over de lijn
}) as GameServer;

new SocketServer(io);

httpServer.listen(config.port, "0.0.0.0", () => {
  console.log(`Server draait op http://localhost:${config.port}`);
});
