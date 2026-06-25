<script lang="ts">
  import { game } from "./stores";
  import Lobby from "./components/Lobby.svelte";
  import Waiting from "./components/Waiting.svelte";
  import DrawPhase from "./components/DrawPhase.svelte";
  import GuessPhase from "./components/GuessPhase.svelte";
  import RelayPhase from "./components/RelayPhase.svelte";
  import Passing from "./components/Passing.svelte";
  import Reveal from "./components/Reveal.svelte";
</script>

<h1>Krabbel<span class="hi">keten</span> ✏️</h1>

{#if $game.screen === "lobby"}
  <Lobby />
{:else if $game.screen === "waiting"}
  <Waiting />
{:else if $game.screen === "phase"}
  {#key $game.phase?.index}
    {#if $game.phase?.type === "draw"}
      <DrawPhase />
    {:else if $game.phase?.type === "guess"}
      <GuessPhase />
    {:else}
      <RelayPhase />
    {/if}
  {/key}
{:else if $game.screen === "passing"}
  <Passing />
{:else if $game.screen === "reveal"}
  <Reveal />
{/if}
