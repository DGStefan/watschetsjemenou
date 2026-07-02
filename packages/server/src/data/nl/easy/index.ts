import { tag } from "../../tag";
import type { WordEntry } from "../../types";
import animals from "./animals.json";
import body from "./body.json";
import foodDrink from "./food-drink.json";
import nature from "./nature.json";
import clothing from "./clothing.json";
import vehicles from "./vehicles.json";
import sportsGamesMusic from "./sports-games-music.json";
import household from "./household.json";
import buildingsPlaces from "./buildings-places.json";
import fantasyHolidays from "./fantasy-holidays.json";
import characters from "./characters.json";
import abstract from "./abstract.json";

/**
 * Alle easy woorden voor het Nederlands, samengevoegd uit de
 * categoriebestanden in deze map. Nieuwe categorie? Voeg een JSON-bestand toe
 * en zet er hier een import- + spread-regel bij.
 */
const words: WordEntry[] = [
  ...tag("nl", "animals", animals),
  ...tag("nl", "body", body),
  ...tag("nl", "food-drink", foodDrink),
  ...tag("nl", "nature", nature),
  ...tag("nl", "clothing", clothing),
  ...tag("nl", "vehicles", vehicles),
  ...tag("nl", "sports-games-music", sportsGamesMusic),
  ...tag("nl", "household", household),
  ...tag("nl", "buildings-places", buildingsPlaces),
  ...tag("nl", "fantasy-holidays", fantasyHolidays),
  ...tag("nl", "characters", characters),
  ...tag("nl", "abstract", abstract),
];

export default words;
