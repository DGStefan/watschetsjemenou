import type { Difficulty, Language } from "@krabbelketen/shared";

/**
 * Eén woord uit een categoriebestand, verrijkt bij het inladen met de taal en
 * categorie (afgeleid van de map- en bestandsnaam). Het spel gebruikt `category`
 * en `language` nu nog niet, maar ze staan klaar zodat spelers later per
 * categorie of taal kunnen kiezen zonder de data te hoeven verhuizen.
 */
export interface WordEntry {
  word: string;
  aliases: string[];
  category: string;
  language: Language;
}

/** Zoals een woord in een JSON-categoriebestand staat. */
export interface RawWord {
  word: string;
  aliases?: string[];
}

/** Alle woorden, geordend per taal en per niveau. */
export type WordSets = Record<Language, Record<Difficulty, WordEntry[]>>;
