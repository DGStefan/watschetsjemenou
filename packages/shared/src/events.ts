// De socket-"contracten": welke events er over en weer gaan, met welke payload.
// Door deze interfaces aan Socket.IO mee te geven worden emit/on volledig getypt.

import type {
  JoinPayload,
  JoinedPayload,
  WaitingPayload,
  PhasePayload,
  PassingPayload,
  RevealPayload,
  StartPayload,
  SubmitPayload,
} from "./types";

// StartPayload wordt nu gebruikt om de (gedeelde) moeilijkheid te zetten.

/** Events die de server naar de client stuurt. */
export interface ServerToClientEvents {
  joined: (payload: JoinedPayload) => void;
  waiting: (payload: WaitingPayload) => void;
  phase: (payload: PhasePayload) => void;
  passing: (payload: PassingPayload) => void;
  reveal: (payload: RevealPayload) => void;
  info: (message: string) => void;
}

/** Events die de client naar de server stuurt. */
export interface ClientToServerEvents {
  join: (payload: JoinPayload) => void;
  // Kies de (gedeelde) moeilijkheid voor de hele lobby.
  setDifficulty: (payload: StartPayload) => void;
  start: () => void;
  submit: (payload: SubmitPayload) => void;
  newgame: () => void;
}
