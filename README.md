# Krabbelketen

Een doorgeef-tekenspel (teken → raad → teken → raad, en aan het eind kijken hoe
ver het afdwaalde). TypeScript-monorepo met een Svelte-client en een
Socket.IO-server die gedeelde types gebruiken.

## Hoe een potje verloopt

Een potje bestaat uit fases; in elke fase werken alle spelers tegelijk. Elke
speler heeft een eigen "boekje" dat na elke fase doorschuift naar de volgende
speler.

1. **Tekenfase** — iedereen krijgt een geheim woord en tekent het (met timer).
2. **Doorgeven** — kort tussenscherm, elke tekening schuift door.
3. **Raadfase** — je ziet de tekening van je voorganger en typt wat het is.
4. Tekenen en raden wisselen elkaar af. Het aantal fases = het aantal spelers,
   zodat elk boekje bij iedereen langskomt.
5. **Onthulling** — alle boekjes naast elkaar.

Je ziet altijd alleen wat je voorganger doorgaf, nooit het oorspronkelijke woord
van een andermans boekje — de server bewaakt dat.

Het potje eindigt altijd op een raad-fase. Bij een **oneven** aantal spelers zou
dat niet vanzelf uitkomen, daarom begint het dan met een korte "kijk & geef
door"-ronde (relay): je ziet je eigen woord, geeft het door zonder te tekenen,
en tekent vervolgens het woord van je voorganger. Bij een even aantal is dat
niet nodig.

De spelcode wordt automatisch gegenereerd (5 tekens, hoofdletters + cijfers) maar
is aan te passen. Hoofdletterongevoelig: kleine letters werken ook.

## Projectstructuur

Een monorepo met [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces):

```
packages/
├── shared/   Gedeelde TypeScript-types en de socket-"contracten"
│             (welke events er over en weer gaan, met welke payload).
├── server/   Node + Socket.IO, opgedeeld in classes:
│   └── src/
│       ├── index.ts         opstarten (express + http + socket.io)
│       ├── SocketServer.ts  vertaalt socket-events <-> rooms
│       ├── RoomManager.ts   alle rooms
│       ├── Room.ts          één room: spelers + status
│       ├── Game.ts          de fase-motor (ketens, timers, scoring)
│       ├── Player.ts        één speler
│       ├── Dictionary.ts    laadt de woordenlijst
│       ├── matching.ts      gok-controle (exact/alias/tikfout)
│       ├── data/eenvoudig.json   woorden (eenvoudig) + aliassen
│       ├── data/geavanceerd.json woorden (geavanceerd: samenstellingen e.d.)
│       └── config.ts        instellingen (env-overschrijfbaar)
└── client/   Svelte + Vite:
    └── src/
        ├── App.svelte       kiest het juiste scherm
        ├── socket.ts        getypte socket-verbinding
        ├── stores.ts        de client-state
        ├── connection.ts    server-events -> state, en de acties
        └── components/      Lobby, Waiting, DrawPhase, GuessPhase, …
```

De **gedeelde types** zijn de kern van de opzet: client en server importeren
dezelfde `ServerToClientEvents` / `ClientToServerEvents`, dus als je een event
aanpast, klagen beide kanten meteen bij het bouwen.

## Eerste keer: installeren

Je hebt [Node.js](https://nodejs.org) 18+ nodig.

```bash
npm install
```

Dit installeert in één keer alle drie de packages.

## Ontwikkelen (met hot reload)

```bash
npm run dev
```

Dit start twee dingen tegelijk:

- de **server** op poort 3000 (herstart automatisch bij wijzigingen),
- de **Vite-dev-server** voor de client op <http://localhost:5173>.

Open <http://localhost:5173>. Vite stuurt de socket-verbinding automatisch door
naar de server op 3000. Wijzigingen in Svelte-componenten zie je meteen.

### Testen met twee spelers

Open <http://localhost:5173> in een gewoon tabblad én in een incognito-venster,
vul dezelfde spelcode in (`TEST`), en start vanuit de wachtkamer. Met 2 spelers
is een potje kort (teken → raad → onthulling); met 4+ krijg je de lange
afdwalingen.

## Bouwen voor productie

```bash
npm run build   # bouwt client (Vite) én server (tsup)
npm start       # serveert de gebouwde client + de sockets op poort 3000
```

In productie serveert de **server** de gebouwde Svelte-app; alles draait dan op
één poort en één origin.

## Instellingen

Boven in `packages/server/src/config.ts`, allemaal overschrijfbaar via
environment variables (handig in Coolify):

| Variabele       | Standaard | Betekenis                          |
| --------------- | --------- | ---------------------------------- |
| `PORT`          | 3000      | Poort van de server                |
| `MIN_PLAYERS`   | 2         | Minimaal aantal spelers (normaal 4)|
| `DRAW_SECONDS`  | 60        | Tekentijd (zet later op 30)        |
| `GUESS_SECONDS` | 45        | Raadtijd                           |
| `RELAY_SECONDS` | 12        | "Kijk & geef door" (oneven spelers)|

## Deployen op de Pi via Coolify

Er ligt een `Dockerfile` die alles in één container bouwt en draait.

1. Zet dit project in een Git-repo (GitHub/GitLab).
2. In Coolify: nieuwe **Application** → je Git-bron en repo.
3. Zet de **Build Pack** op **Dockerfile**.
4. Zet **Ports Exposes** op `3000`.
5. (Optioneel) onder **Environment Variables** bijv. `MIN_PLAYERS=4`,
   `DRAW_SECONDS=30`.
6. Deploy. Voeg daarna onder **Domains** je domein toe (bijv.
   `spel.vddg.eu`); Coolify regelt HTTPS.

Houd het op **één instance** (niet schalen): Socket.IO heeft bij meerdere
instances "sticky sessions" nodig, en dat wil je nu niet.

> Let op: de spelstaat zit in het geheugen. Bij een nieuwe deploy of herstart
> zijn lopende potjes weg — voor een hobby-spel prima.

## Moeilijkheidsgraden

Er zijn twee woordenlijsten, te kiezen in de wachtkamer bij elke nieuwe ronde:

- `data/eenvoudig.json` — gewone, goed tekenbare woorden.
- `data/geavanceerd.json` — samenstellingen en abstracte woorden. Lastiger te
  tekenen, dus meer kans dat de boodschap onderweg hilarisch ontspoort (juist de
  lol van het spel).

## Woorden toevoegen

Voeg een regel toe aan het juiste JSON-bestand in `packages/server/src/data/`:

```json
{ "word": "kameel", "aliases": ["dromedaris"] }
```

`aliases` is optioneel en wordt gebruikt bij het controleren van een gok. Na een
wijziging even opnieuw bouwen (`npm run build`) of de dev-server herstarten.

## Scoring

Bij de onthulling wordt elke gok vergeleken met het woord dat de getekende
afbeelding moest voorstellen. De vergelijking is mild: hoofdletters, accenten en
een lidwoord ("de/het/een") tellen niet mee, een alias geldt als goed, en een
kleine tikfout (zoals een omgewisselde of vergeten letter) telt mee als goed
geraden. Op het onthullingsscherm zie je per gok een badge (✓ goed / ≈ bijna /
✗ mis).

Punten worden zo verdeeld:

| Wat                                                      | Punten | Voor wie            |
| -------------------------------------------------------- | ------ | ------------------- |
| Je tekening wordt goed geraden door de speler na je      | 2      | de tekenaar         |
| Je raadt de tekening van je voorganger goed              | 2      | de rader            |
| Je beginwoord klopt nog aan het eind van de keten        | 4      | de eigenaar (start) |

"Goed" betekent exact, via een alias, of met een kleine tikfout ("bijna").
De puntenaantallen staan bij elkaar in `config.ts` (`points`) en de berekening
in `Game.ts` (methode `reveal`), dus makkelijk aan te passen.

De punten tellen door zolang de lobby bestaat: na elk potje wordt de winst
opgeteld bij het lopende totaal. Het scorebord toont het totaal met de winst van
de laatste ronde erbij (in het groen, bijv. `16 pt +8`).

## Volgende bouwstappen (ideeën)

- Spelers hun eigen woorden laten invullen.
- Live tonen op wie er tijdens een fase nog gewacht wordt.
- Netter omgaan met spelers die midden in een potje wegvallen (nu blijft hun
  plek leeg en worden ontbrekende inzendingen automatisch opgevuld).
- Een "leukste afdwaling"-stemming op het onthullingsscherm.
