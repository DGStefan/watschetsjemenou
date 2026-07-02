// Stabiele client-identiteit + laatste sessie, bewaard in localStorage. Zo gooit
// een (per ongeluk) refresh de speler niet uit zijn potje: bij het herladen sturen
// we dezelfde client-id mee en joinen we automatisch opnieuw.

const CLIENT_ID_KEY = "krabbelketen:clientId";
const SESSION_KEY = "krabbelketen:lastSession";

export interface LastSession {
  room: string;
  name: string;
  avatar: string;
}

function makeId(): string {
  // crypto.randomUUID is beschikbaar in secure contexts (https en localhost).
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Terugval voor het zeldzame geval dat het niet kan (bv. onbeveiligde http).
  return `c-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

let cachedId: string | null = null;

/** De persistente identiteit van deze browser/dit profiel. */
export function clientId(): string {
  if (cachedId) return cachedId;
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = makeId();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    cachedId = id;
  } catch {
    // localStorage geblokkeerd: val terug op een vluchtige id voor deze lading.
    cachedId = makeId();
  }
  return cachedId;
}

export function saveSession(s: LastSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* negeren: zonder opslag werkt reconnect-na-refresh simpelweg niet */
  }
}

export function loadSession(): LastSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<LastSession>;
    if (
      typeof p?.room === "string" &&
      typeof p?.name === "string" &&
      typeof p?.avatar === "string"
    ) {
      return { room: p.room, name: p.name, avatar: p.avatar };
    }
  } catch {
    /* corrupte of onleesbare opslag: gewoon geen sessie */
  }
  return null;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* negeren */
  }
}
