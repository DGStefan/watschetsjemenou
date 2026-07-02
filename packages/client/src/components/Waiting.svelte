<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";
  import { avatarUrl } from "../avatars";

  $: waiting = $game.waiting;
  // De moeilijkheid is gedeeld: iedereen in de lobby ziet dezelfde keuze.
  $: difficulty = waiting?.difficulty ?? "eenvoudig";
  $: scores = waiting?.scores ?? [];
  $: anyPoints = scores.some((s) => s.points > 0);
</script>

<div class="card">
  <h2>Wachtkamer</h2>

  <div class="scores">
    {#each scores as row, i}
      <div class="score-row">
        <span class="rank">{anyPoints && i === 0 ? "🏆" : `${i + 1}.`}</span>
        <img class="pavatar" src={avatarUrl(row.avatar)} alt="" />
        <span class="pname">{row.name}</span>
        <span class="pscore">{row.points}<span class="pt">pt</span></span>
      </div>
    {/each}
  </div>

  <p class="status" class:ready={waiting?.canStart}>
    {#if waiting?.canStart}
      {scores.length} spelers in de lobby — klaar om te starten!
    {:else}
      Wachten op spelers… (minimaal {waiting?.minPlayers ?? 2})
    {/if}
  </p>

  <div class="settings">
    <span class="settings-title">Instellingen</span>
    <span class="settings-note">Geldt voor iedereen in de lobby.</span>

    <span class="field-label diff-label">Moeilijkheid</span>
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
  </div>

  <div class="actions">
    <button class="cta" on:click={actions.start} disabled={!waiting?.canStart}>
      Start het potje
    </button>
    <button class="leave" on:click={actions.leave}>Verlaten</button>
  </div>
</div>

<p class="room-hint">spelcode <strong>{$game.room}</strong></p>

<style>
  .scores {
    margin: 14px 0 4px;
  }
  .score-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 4px;
    border-top: 2px dashed #edece4;
  }
  .score-row:first-child {
    border-top: none;
    padding-top: 4px;
  }
  .rank {
    width: 22px;
    text-align: center;
    font-weight: 800;
    color: #888780;
  }
  .pavatar {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 2.5px solid #1f2d4d;
    display: block;
  }
  .pname {
    flex: 1;
    font-size: 1.3rem;
    font-weight: 800;
    color: #1f2d4d;
  }
  .pscore {
    font-size: 1.5rem;
    font-weight: 800;
    color: #6c5ce7;
  }
  .pscore .pt {
    font-size: 0.8rem;
    font-weight: 700;
    margin-left: 3px;
    color: #8a8fb0;
  }
  .status.ready {
    color: #0f6e56;
    font-weight: 700;
  }
  .settings {
    margin-top: 20px;
    padding: 18px 18px 20px;
    background: #f6faff;
    border: 2px solid #e5edfa;
    border-radius: 18px;
  }
  .settings-title {
    display: block;
    font-size: 1rem;
    font-weight: 800;
    color: var(--ink);
  }
  .settings-note {
    display: block;
    font-size: 0.9rem;
    color: #8a8fb0;
    margin-top: 3px;
  }
  .diff-label {
    /* alleen de spacing wijkt af; look komt van .field-label in app.css */
    margin: 18px 0 14px;
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
    font-size: 0.95rem;
    color: #51607d;
    margin: 16px 0 0;
    min-height: 1.2em;
    line-height: 1.45;
  }
  .actions {
    display: flex;
    align-items: stretch;
    gap: 10px;
    margin-top: 22px;
  }
  .actions button {
    margin-top: 0;
  }
  .leave {
    background: #fff;
    color: #b23b3b;
    box-shadow: 3px 3px 0 #b23b3b;
    white-space: nowrap;
  }
  .room-hint {
    text-align: center;
    font-size: 0.85rem;
    color: #7c89a3;
    margin: 4px 0 0;
  }
  .room-hint strong {
    letter-spacing: 1px;
  }
</style>
