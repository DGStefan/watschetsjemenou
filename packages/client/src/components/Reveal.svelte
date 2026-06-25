<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";
  import type { MatchResult } from "@wattekenjemenou/shared";

  $: chains = $game.reveal?.chains ?? [];
  $: scores = $game.reveal?.scores ?? [];

  function badge(match: MatchResult | undefined): string {
    if (match === "exact") return "✓ goed";
    if (match === "close") return "≈ bijna";
    if (match === "wrong") return "✗ mis";
    return "";
  }
</script>

<div class="card">
  <h2>Onthulling 🎉</h2>

  {#if scores.length}
    <div class="scoreboard">
      <h3>Scorebord</h3>
      {#each scores as row, i}
        <div class="score-row">
          <span>{i === 0 ? "🏆" : `${i + 1}.`} {row.name}</span>
          <span class="score-right">
            <strong>{row.points} pt</strong>
            {#if row.roundPoints > 0}
              <span class="delta">+{row.roundPoints}</span>
            {/if}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  {#each chains as chain}
    <div class="chain">
      <h3>Boekje van {chain.owner}</h3>
      {#each chain.entries as entry}
        <div class="step">
          {#if entry.type === "drawing"}
            <img src={entry.value} alt="tekening" />
            <span class="by">tekening · {entry.by}</span>
          {:else if entry.type === "word"}
            <span class="seed">Startwoord: {entry.value}</span>
          {:else}
            <span>
              “{entry.value}” <span class="by">— {entry.by}</span>
              {#if entry.match}
                <span class="match match-{entry.match}">{badge(entry.match)}</span>
              {/if}
            </span>
          {/if}
        </div>
      {/each}
    </div>
  {/each}

  <button on:click={actions.newgame}>Nieuw potje</button>
</div>

<style>
  .scoreboard {
    background: #eaf3ff;
    border: 2.5px solid #1f2d4d;
    border-radius: 16px;
    padding: 12px 16px;
    margin-bottom: 18px;
  }
  .scoreboard h3 { margin-bottom: 6px; }
  .score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    font-weight: 700;
    color: #1f2d4d;
  }
  .score-right { display: flex; align-items: center; gap: 8px; }
  .score-row strong {
    background: #6c5ce7;
    color: #fff;
    border: 2px solid #1f2d4d;
    border-radius: 10px;
    padding: 1px 10px;
    font-size: 0.85rem;
  }
  .delta { color: #1e9e5e; font-weight: 800; font-size: 0.85rem; }
  .match {
    font-size: 0.72rem;
    font-weight: 800;
    padding: 2px 8px;
    border: 2px solid #1f2d4d;
    border-radius: 10px;
    margin-left: 6px;
    white-space: nowrap;
  }
  .match-exact { background: #c0dd97; color: #27500a; }
  .match-close { background: #fac775; color: #633806; }
  .match-wrong { background: #f7c1c1; color: #791f1f; }
</style>
