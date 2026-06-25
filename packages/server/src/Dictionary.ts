import wordData from "./data/words.json";
import { normalize } from "./matching";

export interface WordEntry {
  word: string;
  aliases: string[];
}

/**
 * De woordenlijst, geladen uit data/words.json.
 * Nieuwe woorden toevoegen? Voeg een regel toe aan dat JSON-bestand:
 *   { "word": "kameel", "aliases": ["dromedaris"] }
 */
class DictionaryImpl {
  private readonly entries: WordEntry[];
  private readonly aliasByWord = new Map<string, string[]>();

  constructor(entries: WordEntry[]) {
    this.entries = entries;
    for (const entry of entries) {
      this.aliasByWord.set(normalize(entry.word), entry.aliases ?? []);
    }
  }

  get size(): number {
    return this.entries.length;
  }

  /** Geef n (zo veel mogelijk verschillende) willekeurige woorden terug. */
  pickWords(n: number): string[] {
    const shuffled = [...this.entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(shuffled[i % shuffled.length].word);
    return out;
  }

  /** Aliassen van een bekend woord (leeg als het woord niet in de lijst staat). */
  aliasesFor(word: string): string[] {
    return this.aliasByWord.get(normalize(word)) ?? [];
  }
}

export const dictionary = new DictionaryImpl(wordData as WordEntry[]);
