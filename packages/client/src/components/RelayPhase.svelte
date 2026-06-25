<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";
  import Timer from "./Timer.svelte";

  let submitted = false;

  $: phase = $game.phase!;

  function pass() {
    if (submitted) return;
    submitted = true;
    actions.submit(""); // relay: niets in te sturen, alleen "klaar"
  }
</script>

<div class="card">
  <div class="phase-head">
    <span class="tag">Fase {phase.index + 1}/{phase.total} · Onthouden</span>
    <Timer endsAt={phase.endsAt} on:timeup={pass} />
  </div>

  <p class="status">
    Dit is jóuw woord. Bekijk het goed en geef door — iemand anders gaat het zo
    tekenen, en jij tekent straks het woord van je voorganger.
  </p>

  {#if phase.prompt.kind === "word"}
    <div class="prompt-word">{phase.prompt.text}</div>
  {/if}

  <button on:click={pass} disabled={submitted}>Geef door</button>

  {#if submitted}
    <p class="status">✅ Doorgegeven! Even wachten op de anderen…</p>
  {/if}
</div>
