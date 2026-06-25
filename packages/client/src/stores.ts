import { writable } from "svelte/store";
import type {
  PassingPayload,
  PhasePayload,
  RevealPayload,
  WaitingPayload,
} from "@krabbelketen/shared";

export type Screen = "lobby" | "waiting" | "phase" | "passing" | "reveal";

export interface GameState {
  screen: Screen;
  room: string;
  info: string;
  waiting?: WaitingPayload;
  phase?: PhasePayload;
  passing?: PassingPayload;
  reveal?: RevealPayload;
}

/** De volledige client-state in één store; componenten lezen hieruit. */
export const game = writable<GameState>({
  screen: "lobby",
  room: "",
  info: "",
});
