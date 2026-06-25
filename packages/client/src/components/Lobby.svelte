<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";
  import { randomRoomCode } from "../roomCode";

  let name = "";
  let room = randomRoomCode();
</script>

<div class="card">
  <p class="status">
    Vul je naam in en kies een spelcode. Testen? Open deze pagina ook in een
    incognito-venster met dezelfde spelcode.
  </p>

  <label for="name">Jouw naam</label>
  <input id="name" type="text" bind:value={name} maxlength="20" placeholder="bijv. Stefan" />

  <label for="room">Spelcode</label>
  <input
    id="room"
    type="text"
    bind:value={room}
    on:input={(e) => (room = e.currentTarget.value.toUpperCase())}
    maxlength="8"
    placeholder="bijv. AB3KP"
    autocapitalize="characters"
  />

  <button on:click={() => actions.join(name, room)}>Meedoen</button>

  {#if $game.info}
    <p class="error">{$game.info}</p>
  {/if}
</div>
