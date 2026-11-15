<script lang="ts">
  import Hast from './Hast.svelte';

  /** Rendu de l'arbre produit par lowlight : seulement des <span class="hljs-…"> et du texte. */
  type HNode =
    | { type: 'text'; value: string }
    | { type: 'element'; tagName: string; properties?: { className?: unknown }; children: HNode[] }
    | { type: string; children?: HNode[] };

  let { nodes }: { nodes: HNode[] } = $props();

  const cls = (n: HNode) => {
    const c = 'properties' in n ? n.properties?.className : undefined;
    return Array.isArray(c) ? c.filter((x) => typeof x === 'string' && /^hljs-[\w-]+$/.test(x)).join(' ') : '';
  };
</script>

{#each nodes as n, i (i)}{#if n.type === 'text' && 'value' in n}{n.value}{:else if n.type === 'element' && 'children' in n}<span class={cls(n)}><Hast nodes={n.children ?? []} /></span>{/if}{/each}
