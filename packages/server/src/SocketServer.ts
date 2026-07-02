import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@krabbelketen/shared";
import { RoomManager } from "./RoomManager";
import type { GameEmitter } from "./Game";
import type { Room } from "./Room";
import { config } from "./config";

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
    this.startSweeper();
  }

  /** Ruim periodiek rooms op die te lang stil zijn, zodat spelcodes vrijkomen. */
  private startSweeper(): void {
    setInterval(() => {
      this.rooms.sweepInactive(Date.now(), config.roomTimeoutMs, (room) => {
        this.io
          .to(room.code)
          .emit(
            "info",
            "Deze room is gesloten wegens inactiviteit. Start een nieuw potje om verder te spelen.",
          );
      });
    }, config.sweepIntervalMs);
  }

  private emitterFor(code: string): GameEmitter {
    return {
      sendPhase: (socketId, payload) => this.io.to(socketId).emit("phase", payload),
      sendPassing: (message) => this.io.to(code).emit("passing", { message }),
      sendReveal: (chains, scores) => this.io.to(code).emit("reveal", { chains, scores }),
    };
  }

  /** Stuur een (net) verbonden speler het scherm dat bij de huidige stand hoort. */
  private sendCurrentState(socket: GameSocket, room: Room): void {
    if (room.status === "waiting") {
      // Iedereen ziet de bijgewerkte lijst (naam is niet langer "(weg)").
      this.io.to(room.code).emit("waiting", room.waitingPayload());
    } else if (room.status === "playing") {
      room.resendStateTo(socket.id);
    } else {
      const reveal = room.currentReveal();
      if (reveal) socket.emit("reveal", reveal);
    }
  }

  private onConnection(socket: GameSocket): void {
    socket.on("join", ({ name, room, avatar, clientId }) => {
      const cleanName = (name || "Naamloos").trim().slice(0, 20) || "Naamloos";
      const code = (room || "TEST").trim().toUpperCase().slice(0, 8) || "TEST";
      // Avatar-id opschonen: alleen letters/cijfers, kort. Leeg -> "a01".
      const cleanAvatar = (avatar || "").replace(/[^a-z0-9]/gi, "").slice(0, 8) || "a01";
      // Client-id opschonen. Ontbreekt die, dan val terug op de socket-id: dan
      // gedraagt de speler zich als voorheen (geen reconnect over een refresh heen).
      const id = (clientId || "").replace(/[^a-z0-9-]/gi, "").slice(0, 64) || socket.id;

      const r = this.rooms.getOrCreate(code);
      const existing = r.getPlayer(id);

      if (existing) {
        // Reconnect: dezelfde speler op een nieuwe verbinding. Toegestaan, óók
        // terwijl er gespeeld wordt.
        existing.reconnect(socket.id);
        existing.name = cleanName;
        existing.avatar = cleanAvatar;
        socket.join(code);
        socket.data.room = code;
        r.touch(Date.now());
        socket.emit("joined", { room: code, name: cleanName });
        this.sendCurrentState(socket, r);
        return;
      }

      // Nieuwe speler: alleen toegestaan zolang de lobby nog wacht.
      if (r.status !== "waiting") {
        socket.emit(
          "info",
          "Dit potje is al bezig. Wacht tot het klaar is of kies een andere spelcode.",
        );
        return;
      }

      socket.join(code);
      socket.data.room = code;
      r.addPlayer(id, socket.id, cleanName, cleanAvatar);
      r.touch(Date.now());

      socket.emit("joined", { room: code, name: cleanName });
      this.io.to(code).emit("waiting", r.waitingPayload());
    });

    socket.on("setDifficulty", ({ difficulty }) => {
      const code = socket.data.room;
      if (!code) return;
      const r = this.rooms.get(code);
      if (!r) return;
      // Veiligheidsklep: val terug op "eenvoudig" bij een onbekende waarde.
      const safe = difficulty === "geavanceerd" ? "geavanceerd" : "eenvoudig";
      r.setDifficulty(safe);
      r.touch(Date.now());
      // Iedereen in de lobby ziet meteen dezelfde keuze.
      this.io.to(code).emit("waiting", r.waitingPayload());
    });

    socket.on("start", () => {
      const code = socket.data.room;
      if (!code) return;
      const r = this.rooms.get(code);
      if (!r) return;
      r.touch(Date.now());
      r.startGame(this.emitterFor(code));
    });

    socket.on("submit", ({ value }) => {
      const code = socket.data.room;
      if (!code) return;
      const r = this.rooms.get(code);
      if (!r) return;
      r.touch(Date.now());
      // Inzendingen worden op stabiele speler-id bijgehouden, niet op socket-id.
      const player = r.getPlayerBySocket(socket.id);
      if (player) r.submit(player.id, value);
    });

    // "Terug naar de lobby" vanaf het onthullingsscherm. Mag een lopend potje
    // niet onderbreken; de spelers die nog kijken laten we met rust (de client
    // blijft op de onthulling tot ze zelf teruggaan).
    socket.on("newgame", () => {
      const code = socket.data.room;
      if (!code) return;
      const r = this.rooms.get(code);
      if (!r || r.status === "playing") return;
      r.touch(Date.now());
      r.resetToWaiting();
      this.io.to(code).emit("waiting", r.waitingPayload());
    });

    socket.on("disconnect", () => {
      const code = socket.data.room;
      if (!code) return;
      const r = this.rooms.get(code);
      if (!r) return;

      // Bewust géén touch: wegvallen is geen activiteit die de room open moet
      // houden. Een verlaten room verstrijkt vanzelf via de opruimer.
      if (r.status === "waiting") {
        const player = r.getPlayerBySocket(socket.id);
        if (player) r.removePlayer(player.id);
        if (r.isEmpty) this.rooms.delete(code);
        else this.io.to(code).emit("waiting", r.waitingPayload());
      } else {
        // Tijdens een potje houden we de plek vrij zodat de ketens kloppen (en de
        // speler kan terugkomen); ontbrekende inzendingen worden automatisch opgevuld.
        r.getPlayerBySocket(socket.id)?.markGone();
      }
    });
  }
}
