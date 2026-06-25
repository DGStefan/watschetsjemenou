<script lang="ts">
  import { onDestroy, createEventDispatcher } from "svelte";

  export let endsAt: number;

  const dispatch = createEventDispatcher<{ timeup: void }>();
  let remaining = 0;
  let fired = false;
  let handle: ReturnType<typeof setInterval> | null = null;

  function tick() {
    remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (remaining <= 0 && !fired) {
      fired = true;
      dispatch("timeup");
    }
  }

  // Herstart de countdown wanneer endsAt verandert (nieuwe fase).
  $: if (endsAt) {
    fired = false;
    if (handle) clearInterval(handle);
    tick();
    handle = setInterval(tick, 250);
  }

  onDestroy(() => {
    if (handle) clearInterval(handle);
  });
</script>

<span class="timer" class:low={remaining <= 10}>⏱ {remaining} sec</span>
