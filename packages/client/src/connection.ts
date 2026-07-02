import type { Difficulty } from "@krabbelketen/shared";
import { socket } from "./socket";
import { game } from "./stores";
import {
  clientId,
  saveSession,
  loadSession,
  clearSession,
  type LastSession,
} from "./identity";

// Onthoud de laatste join, zodat we na een (her)verbinding automatisch opnieuw
// joinen. Bij een verse paginalading (na een refresh) komt dit uit localStorage,
// zodat de speler meteen terugkeert in zijn potje in plaats van in de lobby.
let lastJoin: LastSession | null = loadSession();

socket.on("connect", () => {
  if (lastJoin) {
    socket.emit("join", { ...lastJoin, clientId: clientId() });
  }
});

// Koppel de inkomende server-events aan de store.
socket.on("joined", ({ room }) =>
  game.update((s) => ({ ...s, room, screen: "waiting", info: "" })),
);
socket.on("waiting", (waiting) =>
  game.update((s) => ({
    ...s,
    waiting,
    // Blijf rustig op het onthullingsscherm tot je zélf naar de lobby gaat —
    // ook als iemand anders al terug is of de moeilijkheid wijzigt.
    screen: s.screen === "reveal" ? "reveal" : "waiting",
  })),
);
socket.on("phase", (phase) =>
  game.update((s) => ({ ...s, screen: "phase", phase })),
);
socket.on("passing", (passing) =>
  game.update((s) => ({ ...s, screen: "passing", passing })),
);
socket.on("reveal", (reveal) =>
  game.update((s) => ({ ...s, screen: "reveal", reveal })),
);
socket.on("info", (info) => game.update((s) => ({ ...s, info })));

/** De acties die de client naar de server stuurt. */
export const actions = {
  join: (name: string, room: string, avatar: string) => {
    lastJoin = { name, room, avatar };
    // Bewaar de sessie zodat een refresh automatisch terugkeert in dit potje.
    saveSession(lastJoin);
    socket.emit("join", { ...lastJoin, clientId: clientId() });
  },
  setDifficulty: (difficulty: Difficulty) =>
    socket.emit("setDifficulty", { difficulty }),
  start: () => socket.emit("start"),
  submit: (value: string) => socket.emit("submit", { value }),
  // Alleen jíj gaat terug naar de lobby; de anderen blijven op de onthulling.
  backToLobby: () => {
    socket.emit("newgame");
    game.update((s) => ({ ...s, screen: "waiting" }));
  },
  // De room bewust verlaten: vertel het de server, wis de opgeslagen sessie (zodat
  // een refresh niet opnieuw joint) en ga terug naar het beginscherm.
  leave: () => {
    socket.emit("leave");
    lastJoin = null;
    clearSession();
    game.set({ screen: "lobby", room: "", info: "" });
  },
};
