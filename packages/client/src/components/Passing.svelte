<script lang="ts">
  import { game } from "../stores";
</script>

<div class="card">
  <div class="big-msg">{$game.passing?.message ?? "Doorgeven…"}</div>
</div>
