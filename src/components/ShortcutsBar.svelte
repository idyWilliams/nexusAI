<script lang="ts">
  const links = [
    { label: 'Calendar', href: 'https://calendar.google.com' },
    { label: 'Mail', href: 'https://mail.google.com' },
    { label: 'Drive', href: 'https://drive.google.com' }
  ]
</script>

<nav class="bar" aria-label="Shortcuts">
  {#each links as link}
    <a class="pill" href={link.href}>{link.label}</a>
  {/each}
</nav>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 1rem;
  }
  .pill {
    font-size: 0.82rem;
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    border: 1px solid var(--nx-line);
    color: var(--nx-fg-muted);
    text-decoration: none;
  }
  .pill:hover {
    color: var(--nx-fg);
    border-color: color-mix(in oklab, var(--nx-accent) 35%, var(--nx-line));
  }
</style>
