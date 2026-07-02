<script lang="ts">
  import { game } from "../stores";
  import { actions } from "../connection";
  import { randomRoomCode } from "../roomCode";
  import { AVATARS, avatarUrl, randomAvatar } from "../avatars";

  let name = "";
  let room = randomRoomCode();
  let avatar = randomAvatar();
</script>

<div class="card">
  <p class="status">
    Vul je naam in, kies een avatar en een spelcode.
  </p>

  <label for="name">Jouw naam</label>
  <input id="name" type="text" bind:value={name} maxlength="20" placeholder="bijv. Stefan" />

  <span class="label-like">Kies je avatar</span>
  <div class="avatar-grid">
    {#each AVATARS as id}
      <button
        type="button"
        class="avatar-btn"
        class:selected={avatar === id}
        on:click={() => (avatar = id)}
        aria-label={"Avatar " + id}
      >
        <img src={avatarUrl(id)} alt="" />
      </button>
    {/each}
  </div>

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

  <button class="cta" on:click={() => actions.join(name, room, avatar)}>Meedoen</button>

  {#if $game.info}
    <p class="error">{$game.info}</p>
  {/if}
</div>

<style>
  .label-like {
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    margin: 12px 0 6px;
    color: #51607d;
  }
  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }
  .avatar-btn {
    margin: 0;
    padding: 3px;
    background: #fff;
    border: 2.5px solid #d3d1c7;
    border-radius: 14px;
    box-shadow: none;
    cursor: pointer;
    aspect-ratio: 1;
  }
  .avatar-btn:active:not(:disabled) {
    transform: none;
  }
  .avatar-btn.selected {
    border-color: #6c5ce7;
    box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.25);
  }
  .avatar-btn img {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 10px;
  }
  @media (max-width: 420px) {
    .avatar-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
</style>
