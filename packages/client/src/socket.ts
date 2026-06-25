import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@krabbelketen/shared";

// Let op de volgorde: Socket<ontvangen events, verstuurde events>.
export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Verbindt met dezelfde origin die de pagina serveerde
// (in dev proxyt Vite /socket.io door naar de server).
export const socket: GameSocket = io();
