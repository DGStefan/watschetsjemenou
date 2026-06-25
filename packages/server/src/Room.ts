import type { Difficulty, ScoreRow, WaitingPayload } from "@wattekenjemenou/shared";
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

  constructor(public readonly code: string) {}

  addPlayer(id: string, name: string): Player {
    const player = new Player(id, name);
    this.players.push(player);
    return player;
  }

  removePlayer(id: string): void {
    this.players = this.players.filter((p) => p.id !== id);
  }

  getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  markGone(id: string): void {
    this.getPlayer(id)?.markGone();
  }

  get isEmpty(): boolean {
    return this.players.length === 0;
  }

  get canStart(): boolean {
    return this.players.length >= config.minPlayers;
  }

  waitingPayload(): WaitingPayload {
    return {
      players: this.players.map((p) => p.name),
      minPlayers: config.minPlayers,
      canStart: this.canStart,
    };
  }

  startGame(emitter: GameEmitter, difficulty: Difficulty): void {
    if (this.status === "playing" || !this.canStart) return;
    this.status = "playing";
    // Snapshot van de huidige spelers; de Game houdt deze referenties vast.
    this.game = new Game([...this.players], emitter, difficulty, (chains, roundScores) => {
      // Tel de ronde-punten op bij het lobby-totaal.
      for (const rs of roundScores) {
        this.totals.set(rs.id, (this.totals.get(rs.id) ?? 0) + rs.points);
      }
      const scores: ScoreRow[] = roundScores
        .map((rs) => ({
          name: rs.name,
          points: this.totals.get(rs.id) ?? rs.points,
          roundPoints: rs.points,
        }))
        .sort((a, b) => b.points - a.points);
      this.status = "reveal";
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
  }
}
