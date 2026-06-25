import type { Difficulty } from "@krabbelketen/shared";
import easyData from "./data/eenvoudig.json";
import advancedData from "./data/geavanceerd.json";
import { normalize } from "./matching";

export interface WordEntry {
  word: string;
  aliases: string[];
}

/**
 * De woordenlijsten, geladen uit data/eenvoudig.json en data/geavanceerd.json.
 * Nieuwe woorden toevoegen? Voeg een regel toe aan het juiste JSON-bestand:
 *   { "word": "kameel", "aliases": ["dromedaris"] }
 */
class DictionaryImpl {
  private readonly sets: Record<Difficulty, WordEntry[]>;
  // Aliassen van álle woorden (beide sets), voor de gok-controle.
  private readonly aliasByWord = new Map<string, string[]>();

  constructor(sets: Record<Difficulty, WordEntry[]>) {
    this.sets = sets;
    for (const list of Object.values(sets)) {
      for (const entry of list) {
        this.aliasByWord.set(normalize(entry.word), entry.aliases ?? []);
      }
    }
  }

  size(difficulty: Difficulty): number {
    return this.sets[difficulty].length;
  }

  /** Geef n (zo veel mogelijk verschillende) willekeurige woorden terug. */
  pickWords(difficulty: Difficulty, n: number): string[] {
    const shuffled = [...this.sets[difficulty]];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(shuffled[i % shuffled.length].word);
    return out;
  }

  /** Aliassen van een bekend woord (leeg als het woord niet voorkomt). */
  aliasesFor(word: string): string[] {
    return this.aliasByWord.get(normalize(word)) ?? [];
  }
}

export const dictionary = new DictionaryImpl({
  eenvoudig: easyData as WordEntry[],
  geavanceerd: advancedData as WordEntry[],
});
