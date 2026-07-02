<script lang="ts">
  // Toont "v0.3.0 · a1b2c3d", of alleen "v0.3.0" als er geen commit-hash is.
  const label = __GIT_SHA__
    ? `v${__APP_VERSION__} · ${__GIT_SHA__}`
    : `v${__APP_VERSION__}`;
</script>

<footer class="version">{label}</footer>

<style>
  .version {
    margin-top: auto;
    padding-top: 24px;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--muted);
    opacity: 0.7;
    letter-spacing: 0.02em;
  }
</style>
