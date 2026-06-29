// Datatypes die client én server delen. Eén bron van waarheid.

// "relay" = korte doorgeefronde bij een oneven aantal spelers: je ziet je
// eigen woord en geeft het door (zonder zelf te tekenen).
export type PhaseType = "draw" | "guess" | "relay";

/** Moeilijkheidsgraad: bepaalt uit welke woordenlijst er getrokken wordt. */
export type Difficulty = "eenvoudig" | "geavanceerd";

export interface StartPayload {
  difficulty: Difficulty;
}

/** Wat een speler aan het begin van een fase te zien krijgt. */
export type Prompt =
  | { kind: "word"; text: string } // teken dit woord
  | { kind: "image"; dataUrl: string }; // raad deze tekening

export interface PhasePayload {
  index: number; // 0-based fasenummer
  total: number; // totaal aantal fases (= aantal spelers)
  type: PhaseType;
  endsAt: number; // epoch ms waarop de timer afloopt
  prompt: Prompt;
}

export interface PlayerScore {
  name: string;
  avatar: string; // id van de gekozen avatar, bijv. "a03"
  points: number;
}

export interface WaitingPayload {
  players: string[];
  minPlayers: number;
  canStart: boolean;
  difficulty: Difficulty; // de gedeelde keuze voor de hele lobby
  scores: PlayerScore[]; // lopend toernooi-totaal, hoog naar laag
}

export interface PassingPayload {
  message: string;
}

export type EntryType = "word" | "drawing" | "guess";

/** Uitkomst van het vergelijken van een gok met het bedoelde woord. */
export type MatchResult = "exact" | "close" | "wrong";

export interface RevealEntry {
  type: EntryType;
  value: string; // woord, of data-URL bij een tekening
  by: string | null; // naam van de speler (null bij het startwoord)
  match?: MatchResult; // alleen bij een gok: hoe goed die was
}

export interface RevealChain {
  owner: string;
  entries: RevealEntry[];
}

export interface ScoreRow {
  name: string;
  avatar: string;
  points: number; // totaal over de hele lobby
  roundPoints: number; // punten in de laatste ronde (de "+X")
}

export interface RevealPayload {
  chains: RevealChain[];
  scores: ScoreRow[];
}

export interface JoinedPayload {
  room: string;
  name: string;
}

export interface JoinPayload {
  name: string;
  room: string;
  avatar: string; // id van de gekozen avatar
}

export interface SubmitPayload {
  value: string;
}
