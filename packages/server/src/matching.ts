import type { MatchResult } from "@wattekenjemenou/shared";

const ARTICLES = new Set(["de", "het", "een"]);

/**
 * Maakt een gok of woord vergelijkbaar: kleine letters, accenten eraf,
 * leestekens weg, en een eventueel lidwoord ("de/het/een") vooraan eraf.
 */
export function normalize(input: string): string {
  let text = input.toLowerCase().trim();
  text = text.normalize("NFD").replace(/[̀-ͯ]/g, ""); // accenten weg
  text = text.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const parts = text.split(" ");
  if (parts.length > 1 && ARTICLES.has(parts[0])) parts.shift();
  return parts.join(" ");
}

/**
 * Bewerkingsafstand tussen twee strings (Damerau / optimal string alignment):
 * het aantal invoegingen, verwijderingen, vervangingen óf omwisselingen van
 * twee naast elkaar liggende letters. Het omwisselen van letters ("feits" <->
 * "fiets") telt zo als één foutje, wat bij typen vaak gebeurt.
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // verwijderen
        d[i][j - 1] + 1, // invoegen
        d[i - 1][j - 1] + cost, // vervangen
      );
      // Omwisseling van twee naast elkaar liggende letters.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

export interface MatchOutcome {
  result: MatchResult;
  distance: number;
}

/**
 * Vergelijkt een gok met het bedoelde woord (en eventuele aliassen).
 * - gelijk (na normaliseren) of gelijk aan een alias -> "exact"
 * - kleine spelfout binnen de toegestane afstand            -> "close"
 * - anders                                                  -> "wrong"
 */
export function matchGuess(
  guess: string,
  target: string,
  aliases: string[] = [],
): MatchOutcome {
  const g = normalize(guess);
  if (!g) return { result: "wrong", distance: Infinity };

  const candidates = [target, ...aliases].map(normalize).filter(Boolean);

  let best = Infinity;
  for (const candidate of candidates) {
    if (g === candidate) return { result: "exact", distance: 0 };
    best = Math.min(best, editDistance(g, candidate));
  }

  // Hoe langer het woord, hoe meer tikfouten we toestaan (max 3).
  const ref = normalize(target).length;
  const allowed = Math.min(3, Math.max(1, Math.floor(ref / 4)));
  return best <= allowed
    ? { result: "close", distance: best }
    : { result: "wrong", distance: best };
}
