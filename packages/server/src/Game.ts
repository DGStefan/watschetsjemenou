import type {
  EntryType,
  MatchResult,
  PhasePayload,
  PhaseType,
  Prompt,
  RevealChain,
  RevealEntry,
  ScoreRow,
} from "@wattekenjemenou/shared";
import { Player } from "./Player";
import { dictionary } from "./Dictionary";
import { matchGuess } from "./matching";
import { config } from "./config";

/**
 * Abstractie waarmee de Game naar buiten communiceert, zonder zelf iets van
 * Socket.IO te weten. Dat maakt de spel-logica los testbaar.
 */
export interface GameEmitter {
  sendPhase(playerId: string, payload: PhasePayload): void;
  sendPassing(message: string): void;
  sendReveal(chains: RevealChain[], scores: ScoreRow[]): void;
}

interface Entry {
  type: EntryType;
  value: string;
  by: Player | null;
}

interface Chain {
  owner: Player;
  entries: Entry[];
}

/**
 * De fase-motor van één potje.
 *
 * - Elke speler bezit één keten (zijn "boekje"), die begint met een geheim woord.
 * - In fase i werkt de speler op plek p aan keten (p - i) mod N.
 * - draw/guess wisselen af; na N fases (= aantal spelers) volgt de onthulling.
 */
export class Game {
  private chains: Chain[] = [];
  private phase = -1;
  private accepting = false;
  private readonly submissions = new Map<string, string>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly players: Player[],
    private readonly emitter: GameEmitter,
    private readonly onFinished: () => void,
  ) {}

  start(): void {
    const words = dictionary.pickWords(this.players.length);
    this.chains = this.players.map((owner, i) => ({
      owner,
      entries: [{ type: "word", value: words[i], by: null }],
    }));
    this.phase = -1;
    this.nextPhase();
  }

  /** Inzending van een speler verwerken. */
  submit(playerId: string, value: string): void {
    if (!this.accepting) return;
    if (this.submissions.has(playerId)) return;
    this.submissions.set(playerId, value);
    if (this.submissions.size >= this.players.length) this.endPhase();
  }

  /** Lopende timers stoppen (bij afbreken / nieuw potje). */
  stop(): void {
    this.clearTimer();
    this.accepting = false;
  }

  // ---- interne stappen ----

  private nextPhase(): void {
    this.phase += 1;
    const i = this.phase;
    const n = this.players.length;

    if (i >= n) {
      this.reveal();
      return;
    }

    this.submissions.clear();
    this.accepting = true;
    const type = Game.schedule(i, n);
    const seconds =
      type === "relay"
        ? config.relaySeconds
        : type === "draw"
          ? config.drawSeconds
          : config.guessSeconds;
    const endsAt = Date.now() + seconds * 1000;

    this.players.forEach((player, p) => {
      const chainIndex = Game.mod(p - i, n);
      const last = this.lastEntry(chainIndex);
      const prompt: Prompt =
        last.type === "drawing"
          ? { kind: "image", dataUrl: last.value }
          : { kind: "word", text: last.value };
      this.emitter.sendPhase(player.id, { index: i, total: n, type, endsAt, prompt });
    });

    this.clearTimer();
    this.timer = setTimeout(() => this.endPhase(), seconds * 1000 + config.graceMs);
  }

  private endPhase(): void {
    if (!this.accepting) return;
    this.accepting = false;
    this.clearTimer();

    const i = this.phase;
    const n = this.players.length;
    const type = Game.schedule(i, n);

    // Een relay-fase legt niets vast; de woorden schuiven alleen door.
    if (type !== "relay") {
      this.players.forEach((player, p) => {
        const chainIndex = Game.mod(p - i, n);
        let value = this.submissions.get(player.id);
        if (value === undefined || value === "") {
          value = type === "draw" ? "" : "(niets)";
        }
        this.chains[chainIndex].entries.push({
          type: type === "draw" ? "drawing" : "guess",
          value,
          by: player,
        });
      });
    }

    const message =
      type === "relay"
        ? "Woorden worden doorgegeven…"
        : type === "draw"
          ? "Tekeningen worden doorgegeven…"
          : "Antwoorden worden doorgegeven…";
    this.emitter.sendPassing(message);
    this.timer = setTimeout(() => this.nextPhase(), config.passMs);
  }

  private reveal(): void {
    const points = new Map<string, number>();
    for (const player of this.players) points.set(player.name, 0);
    const add = (name: string, n: number) =>
      points.set(name, (points.get(name) ?? 0) + n);

    const isGood = (r: MatchResult) => r === "exact" || r === "close";

    const chains: RevealChain[] = this.chains.map((chain) => {
      const entries = chain.entries;
      const seed = entries[0];

      const out: RevealEntry[] = entries.map((entry, k) => {
        let match: MatchResult | undefined;
        if (entry.type === "guess") {
          // Een gok hoort bij de tekening ervoor (k-1), die op zijn beurt
          // gemaakt is van het woord daarvoor (k-2).
          const source = entries[k - 2];
          const drawer = entries[k - 1]?.by ?? null;
          if (source) {
            const outcome = matchGuess(
              entry.value,
              source.value,
              dictionary.aliasesFor(source.value),
            );
            match = outcome.result;
            if (isGood(outcome.result)) {
              // Tekening goed geraden door de speler na je:
              // de tekenaar én de rader krijgen punten.
              if (drawer) add(drawer.name, config.points.correctGuessDrawer);
              if (entry.by) add(entry.by.name, config.points.correctGuessGuesser);
            }
          }
        }
        return {
          type: entry.type,
          value: entry.value,
          by: entry.by ? entry.by.name : null,
          match,
        };
      });

      // Heeft het beginwoord de hele keten overleefd? Vergelijk de laatste
      // gok met het startwoord -> bonus voor de eigenaar van het boekje.
      const lastGuess = [...entries].reverse().find((e) => e.type === "guess");
      if (lastGuess) {
        const survived = matchGuess(
          lastGuess.value,
          seed.value,
          dictionary.aliasesFor(seed.value),
        );
        if (isGood(survived.result)) {
          add(chain.owner.name, config.points.wordSurvived);
        }
      }

      return { owner: chain.owner.name, entries: out };
    });

    const scores: ScoreRow[] = [...points.entries()]
      .map(([name, p]) => ({ name, points: p }))
      .sort((a, b) => b.points - a.points);

    this.emitter.sendReveal(chains, scores);
    this.onFinished();
  }

  private lastEntry(chainIndex: number): Entry {
    const entries = this.chains[chainIndex].entries;
    return entries[entries.length - 1];
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Welke soort fase is fase i bij n spelers?
   * Bij een oneven aantal spelers is fase 0 een 'relay' (kijk & geef je woord
   * door). Daardoor schuift alles één plek op en eindigt het potje altijd op
   * een raad-fase. Bij een even aantal begint het meteen met tekenen.
   */
  private static schedule(i: number, n: number): PhaseType {
    const hasRelay = n % 2 === 1;
    if (hasRelay && i === 0) return "relay";
    const k = hasRelay ? i - 1 : i;
    return k % 2 === 0 ? "draw" : "guess";
  }

  /** Modulo die ook bij negatieve getallen positief blijft. */
  private static mod(a: number, n: number): number {
    return ((a % n) + n) % n;
  }
}
