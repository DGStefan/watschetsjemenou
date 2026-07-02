import type { WordSets } from "./types";
import nlEenvoudig from "./nl/eenvoudig";
import nlGeavanceerd from "./nl/geavanceerd";

/**
 * Alle woordenlijsten, geordend per taal en niveau. Nu alleen Nederlands.
 * Een taal toevoegen? Maak data/<taal>/<niveau>/ met categoriebestanden en
 * voeg hier een regel toe.
 */
export const wordSets: WordSets = {
  nl: {
    eenvoudig: nlEenvoudig,
    geavanceerd: nlGeavanceerd,
  },
};
