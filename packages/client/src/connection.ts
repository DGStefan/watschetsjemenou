import { socket } from "./socket";
import { game } from "./stores";

// Koppel de inkomende server-events aan de store.
socket.on("joined", ({ room }) =>
  game.update((s) => ({ ...s, room, screen: "waiting", info: "" })),
);
socket.on("waiting", (waiting) =>
  game.update((s) => ({ ...s, screen: "waiting", waiting })),
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
  join: (name: string, room: string) => socket.emit("join", { name, room }),
  start: () => socket.emit("start"),
  submit: (value: string) => socket.emit("submit", { value }),
  newgame: () => socket.emit("newgame"),
};
