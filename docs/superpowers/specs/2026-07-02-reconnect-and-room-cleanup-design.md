# Reconnect & Room-opruiming — Ontwerp

Datum: 2026-07-02

## Probleem

Twee serverproblemen met dezelfde onderliggende oorzaak:

1. **Rooms lekken.** Een room wordt alleen opgeruimd als hij leeg is én in `waiting`
   staat (`SocketServer.ts` disconnect-handler). Zodra een potje is gestart en
   iedereen wegvalt, blijft de room voor altijd bestaan en wordt de spelcode nooit
   meer vrijgegeven.
2. **Refresh = weg.** Een speler die per ongeluk refresht kan niet terugkomen. Bij
   refresh is alle client-JS-state weg, en de server ziet de nieuwe verbinding als
   een compleet nieuwe speler.

**Gedeelde oorzaak:** speleridentiteit = `socket.id`. Een socket-id is per
verbinding uniek, dus refresh/herverbinding levert altijd een nieuwe identiteit op.
De bestaande auto-rejoin (`connection.ts`) leunt op een in-memory variabele die een
socketreconnect (serverherstart) wel overleeft, maar een page-refresh niet.

## Doel

- Een speler die (per ongeluk) refresht komt volledig terug — óók midden in een
  lopend potje, in de juiste fase.
- Rooms die 30 minuten geen activiteit hadden worden automatisch gesloten, zodat de
  spelcode weer vrijkomt.

## Vastgestelde keuzes

- **Reconnect-scope:** volledig terug in het lopende potje (niet alleen de lobby).
- **Wegval-gedrag:** het spel loopt gewoon door; geen pauze. Bestaande fase-timers en
  auto-fill van ontbrekende inzendingen blijven zoals ze zijn.
- **Room-opruiming:** één periodieke sweep op 30 minuten inactiviteit (geen aparte
  snelle leeg-reap).

## Waarom een client-token, geen device-ID

Een betrouwbaar "device-ID" bestaat niet in een browser; fingerprinting is
onbetrouwbaar en privacy-onvriendelijk. De juiste bouwsteen is een zelf-gegenereerd
token in `localStorage`:

| Situatie | Reconnect werkt? |
|---|---|
| Refresh in dezelfde tab/browser | Ja — `localStorage` overleeft refresh |
| Refresh in incognito | Ja — overleeft binnen dezelfde incognito-sessie |
| Incognito-venster volledig sluiten | Nee — storage gewist (acceptabel) |
| Andere browser / apparaat / storage gewist | Nee — nieuwe speler (acceptabel) |

Op telefoon werkt dit identiek (localStorage in de mobiele browser).

## Ontwerp

### Pijler 1 — Stabiele identiteit + reconnect

**1a. Client-token**
- Client genereert bij eerste bezoek een `clientId` (`crypto.randomUUID()`) en
  bewaart die in `localStorage`.
- Client bewaart ook `lastSession = {room, name, avatar}` in `localStorage` voor
  automatisch opnieuw joinen na refresh.
- `JoinPayload` (shared/src/types.ts) krijgt een veld `clientId`.

**1b. `Player` ontkoppelen van de socket**
- `Player.id` wordt de stabiele `clientId` (niet meer de socket-id).
- Nieuw, muteerbaar veld `Player.socketId` = de huidige verbinding.
- Alle emits die een speler adresseren gaan naar `player.socketId` in plaats van
  `player.id`. Concreet: `GameEmitter.sendPhase` adresseert `player.socketId`. Omdat
  de `Game` `Player`-referenties vasthoudt, klopt het adres automatisch na een
  reconnect.

**1c. Join wordt reconnect-bewust** (`SocketServer` join-handler)
- Zoek in de room een `Player` met dezelfde `clientId`.
  - **Niet gevonden** → nieuwe speler zoals nu. De bestaande weigering "Dit potje is
    al bezig" blijft gelden voor échte nieuwkomers wanneer status ≠ `waiting`.
  - **Gevonden = reconnect** → update `socketId`, `socket.join(code)`, wis de
    "weg"-status, en stuur de huidige staat opnieuw:
    - status `waiting` → `waiting`-payload
    - status `playing` → huidige fase (zie 1d)
    - status `reveal` → laatste `reveal`-payload (zie 1d)
  - Reconnect is dus toegestaan terwijl status ≠ `waiting`, in tegenstelling tot
    nieuwe spelers.

**1d. Mid-game staat-herstel** (`Game` + `Room`)
- De nu-lokale fase-info in `Game.nextPhase` (`type`, `endsAt`) wordt naar velden
  gepromoveerd.
- Nieuwe methode `Game.resendPhaseTo(player)` reconstrueert exact het `phase`-event
  (zelfde prompt-opbouw als `nextPhase`) en stuurt het naar `player.socketId`. Het
  spel loopt door: op tijd terug = kan nog inzenden; anders vult auto-fill aan.
- De laatste `reveal`-payload (chains + scores) wordt in de `Room` bewaard zolang
  status `reveal` is, zodat een reconnect dat scherm terugkrijgt.

**1e. "weg"-marker opschonen** (`Player`)
- `markGone()` plakt nu " (weg)" achter de naam — onomkeerbaar. Dit wordt een pure
  `gone`-boolean met een afgeleide weergavenaam, zodat reconnect de naam schoon
  herstelt.

### Pijler 2 — Room-opruiming (30-min idle sweep)

- `Room` krijgt een `lastActivity`-timestamp, centraal bijgewerkt via een
  `touch(code)` in de `SocketServer` bij elke betekenisvolle actie (join/reconnect,
  start, submit, setDifficulty, newgame).
- `RoomManager` krijgt een periodieke sweeper (`setInterval`, ~1×/min) die rooms met
  `now - lastActivity > 30 min` sluit:
  1. `game?.stop()` — eerst de fase-timers stoppen (anders lekken die).
  2. Room uit de map verwijderen.
  3. Resterende sockets in de room een `info` sturen ("Room gesloten wegens
     inactiviteit").
- De huidige directe delete van een lege `waiting`-room blijft.

### Client-kant (minimaal, nodig voor reconnect)

- `localStorage`: `clientId` (persistente identiteit) en `lastSession`
  ({room, name, avatar}).
- Bij page-load: als `lastSession` bestaat, auto-join met `clientId` zodra de socket
  verbindt. Dit vervangt/verruimt de huidige in-memory `lastJoin` in `connection.ts`.
- `clientId` wordt meegestuurd in elke `join`.

## Aanvaarde grenzen

- **Twee tabbladen met dezelfde `clientId`:** de laatste verbinding "wint" de socket.
  Prima voor een partyspel.
- **Token raden:** een random UUID is niet te raden; geen echte auth nodig.
- **Incognito volledig sluiten** wist het token → nieuwe speler. Acceptabel.

## Testbaarheid

- `Game` is al los testbaar via de emitter-abstractie; `resendPhaseTo` en de sweeper
  (met injecteerbare "now") ook.
- Reconnect-flow: integratietest met twee socketverbindingen die hetzelfde `clientId`
  sturen.

## Geraakte bestanden (indicatief)

- `shared/src/types.ts` — `clientId` op `JoinPayload`.
- `server/src/Player.ts` — `socketId`, schone `gone`-status, weergavenaam.
- `server/src/Game.ts` — fase-velden, `resendPhaseTo`, emits naar `socketId`.
- `server/src/Room.ts` — laatste reveal bewaren, `lastActivity`/`touch`.
- `server/src/RoomManager.ts` — periodieke sweeper.
- `server/src/SocketServer.ts` — reconnect-bewuste join, `touch` per event.
- `client/src/connection.ts` (+ helpers) — `clientId` + `lastSession` in localStorage,
  auto-join na refresh.
