<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";
  import Timer from "./Timer.svelte";
  import DrawingBoard from "./DrawingBoard.svelte";

  let board: DrawingBoard;
  let submitted = false;

  $: phase = $game.phase!;

  function submit() {
    if (submitted) return;
    submitted = true;
    actions.submit(board.getDataUrl());
  }
</script>

<div class="card">
  <div class="phase-head">
    <span class="tag">Fase {phase.index + 1}/{phase.total} · Tekenen</span>
    <Timer endsAt={phase.endsAt} on:timeup={submit} />
  </div>

  {#if phase.prompt.kind === "word"}
    <div class="prompt-word">{phase.prompt.text}</div>
  {/if}

  <DrawingBoard bind:this={board} />

  <button on:click={submit} disabled={submitted}>Klaar met tekenen</button>

  {#if submitted}
    <p class="status">✅ Klaar! Even wachten op de anderen…</p>
  {/if}
</div>
