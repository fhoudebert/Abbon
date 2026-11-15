<script lang="ts">
  import type { RichNode as Node } from '$lib/domain/types';
  import Hast from './Hast.svelte';
  import { lowlight } from './lowlight';
  import { mediaUrl } from './media.svelte';
  import RichNode from './RichNode.svelte';

  /**
   * Rendu d'un nœud par liste blanche : tout type inconnu est réduit à son contenu,
   * aucun attribut n'est recopié tel quel, aucun HTML n'est interprété.
   */
  let { node }: { node: Node } = $props();

  const children = $derived(node.content ?? []);
  const level = $derived(Math.min(6, Math.max(3, Number(node.attrs?.level ?? 3) + 2)));
  const span = (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 1 && n < 50 ? n : undefined;
  };

  function highlighted(code: string, language: unknown) {
    const lang = typeof language === 'string' ? language : '';
    if (lang && lowlight.registered(lang)) return lowlight.highlight(lang, code);
    // Sans langage choisi : détection automatique, comme dans l'éditeur.
    return code.trim() ? lowlight.highlightAuto(code) : null;
  }
</script>

{#snippet kids()}
  {#each children as child, i (i)}
    <RichNode node={child} />
  {/each}
{/snippet}

{#snippet text(marks: NonNullable<Node['marks']>, value: string)}
  {#if marks.length === 0}{value}{:else}
    {@const [m, ...rest] = marks}
    {#if m.type === 'bold'}<strong>{@render text(rest, value)}</strong>
    {:else if m.type === 'italic'}<em>{@render text(rest, value)}</em>
    {:else if m.type === 'underline'}<u>{@render text(rest, value)}</u>
    {:else if m.type === 'strike'}<s>{@render text(rest, value)}</s>
    {:else if m.type === 'code'}<code>{@render text(rest, value)}</code>
    {:else}{@render text(rest, value)}{/if}
  {/if}
{/snippet}

{#if node.type === 'text'}
  {@render text(node.marks ?? [], node.text ?? '')}
{:else if node.type === 'paragraph'}
  <p>{@render kids()}</p>
{:else if node.type === 'heading'}
  <svelte:element this={`h${level}`}>{@render kids()}</svelte:element>
{:else if node.type === 'bulletList'}
  <ul>{@render kids()}</ul>
{:else if node.type === 'orderedList'}
  <ol start={Number(node.attrs?.start) > 1 ? Number(node.attrs?.start) : undefined}>{@render kids()}</ol>
{:else if node.type === 'listItem'}
  <li>{@render kids()}</li>
{:else if node.type === 'blockquote'}
  <blockquote>{@render kids()}</blockquote>
{:else if node.type === 'horizontalRule'}
  <hr />
{:else if node.type === 'hardBreak'}
  <br />
{:else if node.type === 'codeBlock'}
  {@const code = children.map((c) => c.text ?? '').join('')}
  {@const tree = highlighted(code, node.attrs?.language)}
  <pre class="code"><code class="hljs">{#if tree}<Hast nodes={tree.children} />{:else}{code}{/if}</code></pre>
{:else if node.type === 'image'}
  {@const src = mediaUrl(typeof node.attrs?.hash === 'string' ? node.attrs.hash : null)}
  {#if src}
    <img {src} alt={String(node.attrs?.alt ?? '')} loading="lazy" />
  {:else}
    <span class="img-missing" role="img" aria-label={String(node.attrs?.alt ?? '')}></span>
  {/if}
{:else if node.type === 'table'}
  <div class="table-wrap"><table><tbody>{@render kids()}</tbody></table></div>
{:else if node.type === 'tableRow'}
  <tr>{@render kids()}</tr>
{:else if node.type === 'tableHeader'}
  <th colspan={span(node.attrs?.colspan)} rowspan={span(node.attrs?.rowspan)}>{@render kids()}</th>
{:else if node.type === 'tableCell'}
  <td colspan={span(node.attrs?.colspan)} rowspan={span(node.attrs?.rowspan)}>{@render kids()}</td>
{:else}
  {@render kids()}
{/if}

<style>
  p {
    margin-block: 0 0.6em;
  }
  ul,
  ol {
    margin-block: 0 0.6em;
    padding-inline-start: 1.5em;
  }
  blockquote {
    margin: 0 0 0.6em;
    padding-inline-start: 0.9em;
    border-inline-start: 3px solid var(--border);
    color: var(--muted);
  }
  code {
    font-family: ui-monospace, 'Cascadia Code', 'DejaVu Sans Mono', monospace;
    font-size: 0.9em;
    background: var(--accent-soft);
    padding: 0.05em 0.3em;
    border-radius: 4px;
  }
  .code {
    margin-block: 0 0.6em;
    padding: 0.75em 1em;
    border-radius: 8px;
    background: var(--code-bg);
    color: var(--code-fg);
    overflow-x: auto;
    font-size: 0.9rem;
    line-height: 1.45;
    white-space: pre;
  }
  .code code {
    background: none;
    padding: 0;
    font-size: inherit;
  }
  img {
    display: block;
    max-inline-size: 100%;
    max-block-size: 22rem;
    block-size: auto;
    margin-block: 0 0.6em;
    border-radius: 6px;
  }
  .img-missing {
    display: block;
    inline-size: 8rem;
    block-size: 5rem;
    border-radius: 6px;
    background: var(--border);
    margin-block: 0 0.6em;
  }
  .table-wrap {
    overflow-x: auto;
    margin-block: 0 0.6em;
  }
  table {
    border-collapse: collapse;
  }
  th,
  td {
    border: 1px solid var(--border);
    padding: 0.3em 0.6em;
    text-align: start;
    vertical-align: top;
  }
  th {
    background: var(--accent-soft);
  }
  th :global(p),
  td :global(p) {
    margin: 0;
  }
</style>
