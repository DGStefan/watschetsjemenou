import type { Difficulty } from "@krabbelketen/shared";
import { socket } from "./socket";
import { game } from "./stores";

// Onthoud de laatste join, zodat we na een herverbinding (bv. de server is
// herstart) automatisch opnieuw kunnen joinen in plaats van vast te lopen.
let lastJoin: { name: string; room: string } | null = null;
let connectedBefore = false;

socket.on("connect", () => {
  if (connectedBefore && lastJoin) {
    socket.emit("join", lastJoin);
  }
  connectedBefore = true;
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
  join: (name: string, room: string) => {
    lastJoin = { name, room };
    socket.emit("join", { name, room });
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
};
