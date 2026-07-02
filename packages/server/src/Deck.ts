/**
 * Een "stapel" woorden die pas een woord herhaalt als de hele pool een keer
 * op is. Werkt als een kaartspel: schud de pool, deel van boven af, en pas als
 * de stapel leeg is opnieuw schudden. Zo krijgt een lobby veel meer variatie
 * dan bij puur willekeurig trekken.
 */

export type Shuffle = <T>(items: readonly T[]) => T[];

/** Fisher-Yates; los te vervangen zodat tests deterministisch kunnen zijn. */
export const fisherYates: Shuffle = (items) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class Deck {
  // Nog niet uitgedeelde woorden van de huidige ronde; er wordt van het eind
  // getrokken (pop).
  private remaining: string[] = [];
  // Laatst getrokken woord, om een naadloze herhaling op de grens van twee
  // rondes te voorkomen.
  private lastDrawn: string | null = null;

  constructor(
    private readonly pool: readonly string[],
    private readonly shuffle: Shuffle = fisherYates,
  ) {}

  /**
   * Trek n woorden. Binnen één trekking zijn de woorden uniek zolang de pool
   * groot genoeg is (n <= poolgrootte). Zijn er meer spelers dan woorden, dan
   * komen er noodgedwongen dubbele; dat wordt door de aanroeper gelogd.
   */
  draw(n: number): string[] {
    const out: string[] = [];
    while (out.length < n) {
      if (this.remaining.length === 0) this.refill(out);
      const word = this.remaining.pop();
      if (word === undefined) break; // pool is echt leeg
      out.push(word);
      this.lastDrawn = word;
    }
    return out;
  }

  /** Begin een nieuwe ronde: schud de pool opnieuw. */
  private refill(alreadyDrawn: string[]): void {
    if (this.pool.length === 0) return;
    let next = this.shuffle(this.pool);
    // Woorden die deze trekking al gegeven zijn niet nog eens gebruiken
    // (binnen-potje uniek), tenzij dat de stapel leeg zou maken (n > pool).
    const taken = new Set(alreadyDrawn);
    const filtered = next.filter((w) => !taken.has(w));
    if (filtered.length > 0) next = filtered;
    // Voorkom dat het laatst getrokken woord meteen weer bovenop ligt.
    if (next.length > 1 && next[next.length - 1] === this.lastDrawn) {
      [next[0], next[next.length - 1]] = [next[next.length - 1], next[0]];
    }
    this.remaining = next;
  }
}
