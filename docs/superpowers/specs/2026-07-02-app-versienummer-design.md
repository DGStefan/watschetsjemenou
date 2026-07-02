# Ontwerp — Versienummer in de app

**Datum:** 2026-07-02
**Status:** ter review

## Doel

Onderaan de app een versienummer tonen zodat Stefan:

1. een **bewuste release-mijlpaal** kan aflezen (leesbaar semver-nummer dat hij zelf ophoogt), en
2. kan zien **welke code er precies draait** (automatisch build-detail: de commit-hash).

## Twee lagen

### Laag 1 — leesbaar release-nummer (bewust)

De `version` in de **root-`package.json`** (nu `0.2.0`) is de enige bron van waarheid voor het getoonde release-nummer. De workspace-packages houden hun eigen `version`, maar die worden **niet** voor de weergave gebruikt en hoeven niet gesynct te worden.

Ophogen doet Stefan bewust vóór een release:

```
npm version minor    # 0.2.0 -> 0.3.0; maakt meteen een commit + git-tag v0.3.0
git push --follow-tags
```

(`patch`/`major` naar wens.)

### Laag 2 — build-detail (automatisch)

Coolify geeft bij elke deploy de commit mee als Docker build-arg `SOURCE_COMMIT`. Die hash wordt tijdens de Vite-build in de client-bundle gebakken (verkort tot 7 tekens).

## Weergave

Footer onderaan de app, klein en onopvallend, **platte tekst** (geen link):

| Situatie | Weergave |
|---|---|
| Hash beschikbaar (productie via Coolify) | `v0.3.0 · a1b2c3d` |
| Hash niet beschikbaar (leeg/onbekend) | `v0.3.0` |
| Lokale dev (arg niet gezet) | `v0.2.0` |

Regel: is er een echte hash, toon `v{versie} · {hash}`; anders alleen `v{versie}`. Zo staat er nooit een misleidend of leeg build-detail.

## Te wijzigen bestanden

1. **`Dockerfile`** — vóór `RUN npm run build`:
   ```dockerfile
   ARG SOURCE_COMMIT=""
   ENV SOURCE_COMMIT=$SOURCE_COMMIT
   ```
   `ARG` moet gedeclareerd staan, anders negeert Docker de door Coolify meegegeven build-arg.

2. **`packages/client/vite.config.ts`** — een `define`-blok toevoegen dat twee compile-time constanten zet:
   - `__APP_VERSION__` — de `version` uit de root-`package.json` (gelezen via `readFileSync` op `../../package.json`, zodat er geen JSON-import-assertion nodig is).
   - `__GIT_SHA__` — `process.env.SOURCE_COMMIT` verkort tot 7 tekens; leeg/ontbrekend → lege string `""`.

3. **Footer-component** (Svelte) in de client die `__APP_VERSION__` en `__GIT_SHA__` combineert volgens de weergave-regel hierboven en onderaan de layout wordt getoond.

4. **Types-declaratie** (bijv. `packages/client/src/version.d.ts`) die `__APP_VERSION__: string` en `__GIT_SHA__: string` declareert, zodat TypeScript de globale constanten kent.

Geen nieuwe dependencies, geen CI.

## Verificatie

- **Lokaal:** `npm run dev` → footer toont `v0.2.0` (geen hash).
- **Productie-simulatie lokaal:** `SOURCE_COMMIT=$(git rev-parse HEAD) npm run build --workspace @krabbelketen/client` → gebouwde output bevat `v0.2.0 · <hash>`.
- **In Coolify:** na een deploy de footer bekijken. Staat er geen hash, dan komt `SOURCE_COMMIT` niet mee — te controleren/forceren via een build-argument in de Coolify-service-instellingen (arg-naam `SOURCE_COMMIT`).

## Bewust niet gedaan (YAGNI)

- Geen `git describe` (vereist git ín de build; `.git` staat in `.dockerignore`).
- Geen auto-increment per deploy (release moet betekenis houden).
- Geen link naar de GitHub-commit (repo is mogelijk privé; platte tekst volstaat).
- Workspace-versies worden niet gesynct met de root.
