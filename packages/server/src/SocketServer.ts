import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@wattekenjemenou/shared";
import { RoomManager } from "./RoomManager";
import type { GameEmitter } from "./Game";

/** Data die we per socket onthouden. */
export interface SocketData {
  room?: string;
}

export type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

type GameSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

/**
 * Vertaalt socket-events naar acties op de rooms en terug.
 * Dit is de enige plek die Socket.IO kent; de spel-logica blijft er los van.
 */
export class SocketServer {
  private readonly rooms = new RoomManager();

  constructor(private readonly io: GameServer) {
    io.on("connection", (socket) => this.onConnection(socket));
  }

  private emitterFor(code: string): GameEmitter {
    return {
      sendPhase: (playerId, payload) => this.io.to(playerId).emit("phase", payload),
      sendPassing: (message) => this.io.to(code).emit("passing", { message }),
      sendReveal: (chains, scores) => this.io.to(code).emit("reveal", { chains, scores }),
    };
  }

  private onConnection(socket: GameSocket): void {
    socket.on("join", ({ name, room }) => {
      const cleanName = (name || "Naamloos").trim().slice(0, 20) || "Naamloos";
      const code = (room || "TEST").trim().toUpperCase().slice(0, 8) || "TEST";

      const r = this.rooms.getOrCreate(code);
      if (r.status !== "waiting") {
        socket.emit(
          "info",
          "Dit potje is al bezig. Wacht tot het klaar is of kies een andere spelcode.",
        );
        return;
      }

      socket.join(code);
      socket.data.room = code;
      r.addPlayer(socket.id, cleanName);

      socket.emit("joined", { room: code, name: cleanName });
      this.io.to(code).emit("waiting", r.waitingPayload());
    });

    socket.on("start", ({ difficulty }) => {
      const code = socket.data.room;
      if (!code) return;
      const r = this.rooms.get(code);
      // Veiligheidsklep: val terug op "eenvoudig" bij een onbekende waarde.
      const safe = difficulty === "geavanceerd" ? "geavanceerd" : "eenvoudig";
      r?.startGame(this.emitterFor(code), safe);
    });

    socket.on("submit", ({ value }) => {
      const code = socket.data.room;
      if (!code) return;
      this.rooms.get(code)?.submit(socket.id, value);
    });

    socket.on("newgame", () => {
      const code = socket.data.room;
      if (!code) return;
      const r = this.rooms.get(code);
      if (!r) return;
      r.resetToWaiting();
      this.io.to(code).emit("waiting", r.waitingPayload());
    });

    socket.on("disconnect", () => {
      const code = socket.data.room;
      if (!code) return;
      const r = this.rooms.get(code);
      if (!r) return;

      if (r.status === "waiting") {
        r.removePlayer(socket.id);
        if (r.isEmpty) this.rooms.delete(code);
        else this.io.to(code).emit("waiting", r.waitingPayload());
      } else {
        // Tijdens een potje houden we de plek vrij zodat de ketens kloppen;
        // ontbrekende inzendingen worden automatisch opgevuld.
        r.markGone(socket.id);
      }
    });
  }
}
