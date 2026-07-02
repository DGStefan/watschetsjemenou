import type {
  Difficulty,
  RevealPayload,
  ScoreRow,
  WaitingPayload,
} from "@krabbelketen/shared";
import { Player } from "./Player";
import { Game, type GameEmitter } from "./Game";
import { config } from "./config";

export type RoomStatus = "waiting" | "playing" | "reveal";

/** Eén room: de spelers en (als er gespeeld wordt) het lopende potje. */
export class Room {
  status: RoomStatus = "waiting";
  private players: Player[] = [];
  private game: Game | null = null;
  // Lopend toernooi-totaal per speler-id, blijft staan zolang de lobby bestaat.
  private totals = new Map<string, number>();
  // Gedeelde moeilijkheid voor de hele lobby (blijft tussen potjes onthouden).
  private difficulty: Difficulty = "eenvoudig";
  // Laatste onthulling, bewaard zolang status "reveal" is, zodat een speler die
  // op dat scherm refresht het terugkrijgt.
  private lastReveal: RevealPayload | null = null;
  // Tijdstip (epoch ms) van de laatste betekenisvolle actie; de opruimer sluit
  // rooms die te lang stil zijn.
  lastActivity = Date.now();

  constructor(public readonly code: string) {}

  /** Markeer activiteit, zodat de room niet als inactief wordt opgeruimd. */
  touch(now: number): void {
    this.lastActivity = now;
  }

  setDifficulty(difficulty: Difficulty): void {
    if (this.status !== "waiting") return;
    this.difficulty = difficulty;
  }

  addPlayer(id: string, socketId: string, name: string, avatar: string): Player {
    const player = new Player(id, socketId, name, avatar);
    this.players.push(player);
    return player;
  }

  removePlayer(id: string): void {
    this.players = this.players.filter((p) => p.id !== id);
  }

  getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  getPlayerBySocket(socketId: string): Player | undefined {
    return this.players.find((p) => p.socketId === socketId);
  }

  /** De bewaarde onthulling (alleen zinvol zolang status "reveal" is). */
  currentReveal(): RevealPayload | null {
    return this.lastReveal;
  }

  /** Stuur een terugkerende speler het scherm dat bij een lopend potje hoort. */
  resendStateTo(socketId: string): void {
    this.game?.resendStateTo(socketId);
  }

  /** Stop lopende timers (bij opruimen van de room). */
  dispose(): void {
    this.game?.stop();
  }

  get isEmpty(): boolean {
    return this.players.length === 0;
  }

  get canStart(): boolean {
    return this.players.length >= config.minPlayers;
  }

  waitingPayload(): WaitingPayload {
    return {
      players: this.players.map((p) => p.displayName),
      minPlayers: config.minPlayers,
      canStart: this.canStart,
      difficulty: this.difficulty,
      scores: this.players
        .map((p) => ({
          name: p.displayName,
          avatar: p.avatar,
          points: this.totals.get(p.id) ?? 0,
        }))
        .sort((a, b) => b.points - a.points),
    };
  }

  startGame(emitter: GameEmitter): void {
    if (this.status === "playing" || !this.canStart) return;
    this.status = "playing";
    this.lastReveal = null;
    // Snapshot van de huidige spelers; de Game houdt deze referenties vast.
    this.game = new Game([...this.players], emitter, this.difficulty, (chains, roundScores) => {
      // Tel de ronde-punten op bij het lobby-totaal.
      for (const rs of roundScores) {
        this.totals.set(rs.id, (this.totals.get(rs.id) ?? 0) + rs.points);
      }
      const scores: ScoreRow[] = roundScores
        .map((rs) => ({
          name: rs.name,
          avatar: rs.avatar,
          points: this.totals.get(rs.id) ?? rs.points,
          roundPoints: rs.points,
        }))
        .sort((a, b) => b.points - a.points);
      this.status = "reveal";
      this.lastReveal = { chains, scores };
      emitter.sendReveal(chains, scores);
    });
    this.game.start();
  }

  submit(id: string, value: string): void {
    this.game?.submit(id, value);
  }

  resetToWaiting(): void {
    this.game?.stop();
    this.game = null;
    this.status = "waiting";
    this.lastReveal = null;
  }
}
