import type { WordSets } from "./types";
import nlEasy from "./nl/easy";
import nlAdvanced from "./nl/advanced";

/**
 * Alle woordenlijsten, geordend per taal en niveau. De mapstructuur is Engels
 * (data/<taal>/<niveau>/<categorie>.json) zodat extra talen later logisch
 * passen; de niveau-sleutels blijven de Difficulty-waarden die het spel kent.
 */
export const wordSets: WordSets = {
  nl: {
    eenvoudig: nlEasy,
    geavanceerd: nlAdvanced,
  },
};
