<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";
  import Timer from "./Timer.svelte";

  let guess = "";
  let submitted = false;

  $: phase = $game.phase!;

  function submit() {
    if (submitted) return;
    submitted = true;
    actions.submit(guess.trim());
  }
</script>

<div class="card">
  <div class="phase-head">
    <span class="tag">Fase {phase.index + 1}/{phase.total} · Raden</span>
    <Timer endsAt={phase.endsAt} on:timeup={submit} />
  </div>

  {#if phase.prompt.kind === "image"}
    <img class="prompt-img" src={phase.prompt.dataUrl} alt="tekening van je voorganger" />
  {/if}

  <input
    type="text"
    bind:value={guess}
    maxlength="40"
    placeholder="Wat zie je hier? Typ je antwoord…"
    on:keydown={(e) => e.key === "Enter" && submit()}
  />

  <button on:click={submit} disabled={submitted}>Antwoord versturen</button>

  {#if submitted}
    <p class="status">✅ Verstuurd! Even wachten op de anderen…</p>
  {/if}
</div>
