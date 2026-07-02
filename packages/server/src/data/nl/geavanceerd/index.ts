import { tag } from "../../tag";
import type { WordEntry } from "../../types";
import dieren from "./dieren.json";
import lichaam from "./lichaam.json";
import etenDrinken from "./eten-drinken.json";
import natuur from "./natuur.json";
import kleding from "./kleding.json";
import voertuigen from "./voertuigen.json";
import sportSpelMuziek from "./sport-spel-muziek.json";
import huisVoorwerpen from "./huis-voorwerpen.json";
import gebouwenPlekken from "./gebouwen-plekken.json";
import fantasieFeest from "./fantasie-feest.json";
import abstract from "./abstract.json";
import uitdrukkingen from "./uitdrukkingen.json";

/**
 * Alle geavanceerd-woorden voor het Nederlands, samengevoegd uit de
 * categoriebestanden in deze map. Nieuwe categorie? Voeg een JSON-bestand toe
 * en zet er hier een importregel + spread-regel bij.
 */
const words: WordEntry[] = [
  ...tag("nl", "dieren", dieren),
  ...tag("nl", "lichaam", lichaam),
  ...tag("nl", "eten-drinken", etenDrinken),
  ...tag("nl", "natuur", natuur),
  ...tag("nl", "kleding", kleding),
  ...tag("nl", "voertuigen", voertuigen),
  ...tag("nl", "sport-spel-muziek", sportSpelMuziek),
  ...tag("nl", "huis-voorwerpen", huisVoorwerpen),
  ...tag("nl", "gebouwen-plekken", gebouwenPlekken),
  ...tag("nl", "fantasie-feest", fantasieFeest),
  ...tag("nl", "abstract", abstract),
  ...tag("nl", "uitdrukkingen", uitdrukkingen),
];

export default words;
