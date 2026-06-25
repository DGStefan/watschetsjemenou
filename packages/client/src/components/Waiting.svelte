<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";

  $: waiting = $game.waiting;
  // De moeilijkheid is gedeeld: iedereen in de lobby ziet dezelfde keuze.
  $: difficulty = waiting?.difficulty ?? "eenvoudig";
</script>

<div class="card">
  <h2>Wachtkamer</h2>
  <p class="status">Room: <span class="tag">{$game.room}</span></p>

  <div class="players">
    {#each waiting?.players ?? [] as player, i}
      <span class="chip c{(i % 4) + 1}">{player}</span>
    {/each}
  </div>

  <p class="status">
    {#if waiting?.canStart}
      {waiting.players.length} spelers in de lobby — klaar om te starten!
    {:else}
      Wachten op spelers… (minimaal {waiting?.minPlayers ?? 2})
    {/if}
  </p>

  <span class="diff-label">Moeilijkheid (voor iedereen)</span>
  <div class="diff-toggle">
    <button
      class:active={difficulty === "eenvoudig"}
      on:click={() => actions.setDifficulty("eenvoudig")}
    >
      Eenvoudig
    </button>
    <button
      class:active={difficulty === "geavanceerd"}
      on:click={() => actions.setDifficulty("geavanceerd")}
    >
      Geavanceerd
    </button>
  </div>
  <p class="diff-hint">
    {#if difficulty === "eenvoudig"}
      Gewone, goed tekenbare woorden.
    {:else}
      Samenstellingen en abstracte woorden — meer kans op hilarische
      misverstanden!
    {/if}
  </p>

  <button class="cta" on:click={actions.start} disabled={!waiting?.canStart}>
    Start het potje
  </button>
</div>

<style>
  .diff-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    color: #51607d;
    margin: 14px 0 6px;
  }
  .diff-toggle {
    display: flex;
    gap: 10px;
  }
  .diff-toggle button {
    flex: 1;
    margin-top: 0;
    background: #fff;
    color: #1f2d4d;
    box-shadow: 3px 3px 0 #1f2d4d;
  }
  .diff-toggle button.active {
    background: #6c5ce7;
    color: #fff;
  }
  .diff-hint {
    font-size: 0.85rem;
    color: #51607d;
    margin: 8px 0 0;
    min-height: 1.2em;
  }
</style>
