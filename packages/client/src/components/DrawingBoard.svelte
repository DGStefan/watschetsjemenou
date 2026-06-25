<script lang="ts">
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let color = "#222222";
  let drawing = false;
  let last: { x: number; y: number } | null = null;

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  });

  // Door de parent aangeroepen bij het insturen.
  export function getDataUrl(): string {
    return canvas.toDataURL("image/png");
  }

  export function clear(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function pos(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect();
    const point = "touches" in e ? e.touches[0] : e;
    return {
      x: ((point.clientX - rect.left) / rect.width) * canvas.width,
      y: ((point.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(e: MouseEvent | TouchEvent) {
    drawing = true;
    last = pos(e);
  }

  function move(e: MouseEvent | TouchEvent) {
    if (!drawing || !last) return;
    const p = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  }

  function end() {
    drawing = false;
    last = null;
  }
</script>

<canvas
  bind:this={canvas}
  width="800"
  height="600"
  on:mousedown={start}
  on:mousemove={move}
  on:mouseup={end}
  on:mouseleave={end}
  on:touchstart|preventDefault={start}
  on:touchmove|preventDefault={move}
  on:touchend={end}
></canvas>

<div class="toolbar">
  <input type="color" bind:value={color} aria-label="Kleur" />
  <button class="secondary" on:click={clear}>Wissen</button>
</div>
