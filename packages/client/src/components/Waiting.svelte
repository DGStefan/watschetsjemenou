<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";

  $: waiting = $game.waiting;
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
      {waiting.players.length} spelers — klaar om te starten!
    {:else}
      Wachten op spelers… (minimaal {waiting?.minPlayers ?? 2})
    {/if}
  </p>

  <button class="cta" on:click={actions.start} disabled={!waiting?.canStart}>
    Start het potje
  </button>
</div>
