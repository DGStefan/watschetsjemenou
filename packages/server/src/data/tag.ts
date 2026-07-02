import type { Language } from "@krabbelketen/shared";
import type { RawWord, WordEntry } from "./types";

/**
 * Verrijk de rauwe woorden uit één categoriebestand met hun taal en categorie.
 * De barrels (data/<taal>/<niveau>/index.ts) roepen dit per bestand aan.
 */
export function tag(
  language: Language,
  category: string,
  words: RawWord[],
): WordEntry[] {
  return words.map((w) => ({
    word: w.word,
    aliases: w.aliases ?? [],
    category,
    language,
  }));
}
