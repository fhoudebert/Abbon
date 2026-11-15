<script lang="ts">
  import type { RichValue } from '$lib/domain/types';
  import RichNode from './RichNode.svelte';

  /** Affiche un contenu riche (ou du texte simple) sans jamais injecter de HTML. */
  let { value, inline = false }: { value: RichValue | null | undefined; inline?: boolean } = $props();
</script>

{#if value == null || value === ''}
  <!-- vide -->
{:else if typeof value === 'string'}
  <span class="plain">{value}</span>
{:else}
  <div class="rich" class:inline>
    {#each value.content ?? [] as node, i (i)}
      <RichNode {node} />
    {/each}
  </div>
{/if}

<style>
  .plain {
    white-space: pre-wrap;
  }
  .rich {
    display: flow-root;
  }
  .rich > :global(:first-child) {
    margin-block-start: 0;
  }
  .rich > :global(:last-child) {
    margin-block-end: 0;
  }
  .rich.inline > :global(p) {
    margin: 0;
  }
</style>
