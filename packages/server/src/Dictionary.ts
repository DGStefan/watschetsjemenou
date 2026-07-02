import type { Difficulty, Language } from "@krabbelketen/shared";
import { wordSets } from "./data";
import type { WordEntry, WordSets } from "./data/types";
import { normalize } from "./matching";

export type { WordEntry } from "./data/types";

/** Zolang er maar één taal is, is dit de standaard. */
const DEFAULT_LANGUAGE: Language = "nl";

/**
 * De woordenlijsten, geladen uit data/<taal>/<niveau>/<categorie>.json.
 *
 * Nieuwe woorden toevoegen? Voeg een regel toe aan het juiste categorie-JSON:
 *   { "word": "kameel", "aliases": ["dromedaris"] }
 * Nieuwe categorie? Zet een JSON-bestand in de niveau-map en importeer het in
 * de barrel (data/nl/<niveau>/index.ts).
 *
 * De Dictionary levert alleen de pool en de aliassen; het zonder-herhaling
 * trekken gebeurt per lobby in een Deck (zie Room).
 */
class DictionaryImpl {
  private readonly sets: WordSets;
  // Aliassen van álle woorden (alle talen/niveaus), voor de gok-controle.
  private readonly aliasByWord = new Map<string, string[]>();

  constructor(sets: WordSets) {
    this.sets = sets;
    for (const byDifficulty of Object.values(sets)) {
      for (const list of Object.values(byDifficulty)) {
        for (const entry of list as WordEntry[]) {
          this.aliasByWord.set(normalize(entry.word), entry.aliases ?? []);
        }
      }
    }
  }

  /** De volledige woordenpool (alleen de woorden) voor een niveau. */
  poolFor(
    difficulty: Difficulty,
    language: Language = DEFAULT_LANGUAGE,
  ): string[] {
    return this.sets[language][difficulty].map((e) => e.word);
  }

  size(difficulty: Difficulty, language: Language = DEFAULT_LANGUAGE): number {
    return this.sets[language][difficulty].length;
  }

  /** Aliassen van een bekend woord (leeg als het woord niet voorkomt). */
  aliasesFor(word: string): string[] {
    return this.aliasByWord.get(normalize(word)) ?? [];
  }
}

export const dictionary = new DictionaryImpl(wordSets);
