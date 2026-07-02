# Ontwerp: gecategoriseerde woorddata + herhaling voorkomen

Datum: 2026-07-02

## Probleem

Spelers zien te vaak dezelfde woorden terugkomen. Twee oorzaken:

1. `Dictionary.pickWords()` schudt per potje opnieuw en heeft **geen geheugen**
   tussen potjes. In dezelfde lobby komen woorden daardoor snel terug.
2. De woorddata staat in twee platte lijsten (`data/eenvoudig.json`,
   `data/geavanceerd.json`). Dat maakt het lastig om veel nieuwe woorden
   overzichtelijk toe te voegen.

## Doelen

- Data herstructureren zodat er makkelijk veel woorden bijkomen, netjes
  geordend per **taal → niveau → categorie**.
- Binnen een lobby een woord pas laten terugkomen als **alle** woorden van dat
  niveau een keer geweest zijn.
- Niveaus (`eenvoudig` / `geavanceerd`) strikt gescheiden houden.
- De structuur voorbereiden op toekomstige, speler-zichtbare keuze van
  **categorie** en **taal** — zonder dat nu al te bouwen.

## Niet-doelen (nu)

- Spelers laten kiezen welke categorieën of taal ze willen. (Later; de data
  wordt er wel op voorbereid.)
- Herhaling onthouden over lobby's heen of na een serverherstart. (Geen
  database; per-lobby in het servergeheugen is genoeg.)

## Datastructuur

Taal → niveau → categorie(bestand) → woorden.

```
packages/server/src/data/
  nl/
    eenvoudig/
      dieren.json
      eten-drinken.json
      voorwerpen.json
      voertuigen.json
      natuur.json
      lichaam.json
      sport-spel.json
      fantasie.json
      kleding.json
      gebouwen-plekken.json
    geavanceerd/
      ...(zelfde categorie-indeling, eigen woorden)
  (en/  ← toekomstig, zonder codewijziging elders)
  index.ts              ← barrel: bundelt categorieën → niveau → taal
```

De barrel staat op `data/index.ts` en exporteert één
`Record<Language, Record<Difficulty, WordEntry[]>>`, zodat `Dictionary` er
direct op kan bouwen.

- Elk categoriebestand blijft dezelfde vorm: `[{ "word": "...", "aliases": [...] }]`.
- **Nieuwe categorie toevoegen** = JSON-bestand neerzetten + één importregel in
  de barrel van dat niveau.
- Niveaus blijven fysiek gescheiden (aparte mappen); de barrel voegt ze nooit
  samen over niveaus heen.
- De huidige `eenvoudig.json` / `geavanceerd.json` worden verdeeld over deze
  categoriebestanden en daarna verwijderd.

## Inladen (build-safe)

- Statische JSON-imports blijven behouden — esbuild/tsup bakt ze in de bundle,
  precies zoals nu. **Geen** runtime-bestanden lezen, **geen** Docker-/deploy-
  wijziging.
- Een barrel (`data/nl/index.ts` of `data/index.ts`) importeert per niveau de
  categoriebestanden en plakt ze aan elkaar tot één `WordEntry[]` per niveau.
- Bij het inladen krijgt elk woord in het geheugen een `category`- en
  `language`-label mee (afgeleid van map-/bestandsnaam). Het spel gebruikt dit
  nu niet, maar het staat klaar voor toekomstige selectie zonder datamigratie.

## Woordkeuze zonder herhaling — "Deck" per lobby

Nieuwe kleine klasse `Deck` (server):

- Houdt een geschudde stapel van de volledige pool van één niveau.
- `draw(n)` trekt n woorden van boven de stapel.
- Raakt de stapel leeg (of < n), dan opnieuw schudden. Bij het herschudden
  wordt geborgd dat het laatst getrokken woord niet meteen weer als eerste
  bovenop ligt (voorkomt naadloze back-to-back herhaling).
- Randgeval: `n` groter dan de poolgrootte → binnen dat ene potje noodgedwongen
  dubbel, met een log-melding. (Gebeurt vrijwel nooit.)

Integratie:

- De `Room` houdt een `Map<Difficulty, Deck>` (lui aangemaakt per niveau), zodat
  wisselen van niveau elk zijn eigen voortgang bewaart. Leeft in het
  servergeheugen van de room en verdwijnt bij het opruimen ervan.
- De `Room` trekt bij het starten van een potje N woorden uit het deck van het
  huidige niveau en geeft die door aan `Game`. `Game.start()` roept dus niet
  langer zelf `dictionary.pickWords()` aan.
- `Dictionary` levert de pool per niveau (`poolFor(difficulty)`); `Deck`/`Room`
  regelt de volgorde-zonder-herhaling. De alias-lookup voor de gok-controle
  blijft ongewijzigd op `Dictionary`.

## Types (shared)

- `Language = "nl"` (voorbereid op `"en"`).
- `category?: string` en `language?: Language` optioneel op het interne
  woordtype. Niets hiervan is nu speler-zichtbaar.

## Testen

Unit-tests voor `Deck`:

- Geen herhaling tot de hele pool uitgeput is.
- Correct herschudden zodra de pool op is.
- Randgeval `n > poolgrootte` levert het juiste aantal (met dubbels) op.
