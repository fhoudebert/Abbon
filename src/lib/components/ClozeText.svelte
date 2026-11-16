<script lang="ts">
  import { clozeSegments, gapExpected, gapOptions } from '$lib/domain/cloze';
  import { shuffled } from '$lib/domain/session';
  import type { Question } from '$lib/domain/types';
  import { t } from '$lib/i18n/index.svelte';

  /**
   * Texte à trous : le texte, avec un champ de saisie ou une liste déroulante à chaque trou.
   * Sert au passage (modifiable), au corrigé et à l'aperçu (figé).
   */
  let {
    question,
    lang,
    fallback,
    values = [],
    locked = false,
    results = null,
    seed = null,
    labelledby,
    onchange,
    oncommit,
  }: {
    question: Question;
    lang: string;
    fallback?: string;
    /** Réponse donnée à chaque trou. */
    values?: readonly (string | null | undefined)[];
    locked?: boolean;
    /** Correction trou par trou (null : pas de correction affichée). */
    results?: readonly boolean[] | null;
    /** Graine du mélange des listes déroulantes (null : ordre alphabétique). */
    seed?: string | null;
    labelledby?: string;
    onchange?: (gap: number, value: string) => void;
    /** Fin de saisie d'un champ (perte du focus) ou choix dans une liste. */
    oncommit?: () => void;
  } = $props();

  const gaps = $derived(question.expected?.gaps ?? []);
  const texts = $derived(question.expected?.text ?? {});
  const shownLang = $derived(texts[lang]?.trim() ? lang : fallback && texts[fallback]?.trim() ? fallback : Object.keys(texts)[0]);
  const segments = $derived(clozeSegments(texts[shownLang ?? ''] ?? ''));
  const options = $derived(
    gaps.map((g, i) => {
      const all = gapOptions(g);
      return seed ? shuffled(all, `${seed}:${i}`) : [...all].sort((a, b) => a.localeCompare(b));
    }),
  );
  const label = (i: number) => t('play.gap', { n: i + 1, total: gaps.length });
</script>

<div class="cloze" role="group" aria-labelledby={labelledby} lang={shownLang}>
  {#each segments as s, k (k)}
    {#if 'text' in s}{s.text}{:else if gaps[s.gap]}
      {@const i = s.gap}
      {@const gap = gaps[i]}
      {@const wrong = results ? !results[i] : false}
      <span class="gap" class:ok={results?.[i]} class:ko={wrong}>
        {#if gap.kind === 'select'}
          <select
            aria-label={label(i)}
            disabled={locked}
            value={values[i] ?? ''}
            onchange={(e) => {
              onchange?.(i, e.currentTarget.value);
              oncommit?.();
            }}
          >
            <option value="">{t('play.gapChoose')}</option>
            {#each options[i] as o (o)}<option value={o}>{o}</option>{/each}
          </select>
        {:else}
          <input
            type="text"
            aria-label={label(i)}
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            readonly={locked}
            value={values[i] ?? ''}
            oninput={(e) => onchange?.(i, e.currentTarget.value)}
            onchange={() => oncommit?.()}
          />
        {/if}
        {#if wrong}<span class="expected"><span aria-hidden="true">→</span> <span class="visually-hidden">{t('review.expected')} :</span> {gapExpected(gap)}</span>{/if}
      </span>
    {/if}
  {/each}
</div>

<style>
  .cloze {
    white-space: pre-line;
    line-height: 2.6;
    font-size: 1.1rem;
  }
  .gap {
    display: inline-flex;
    align-items: baseline;
    gap: 0.4rem;
    white-space: nowrap;
  }
  input,
  select {
    font: inherit;
    color: var(--text);
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 8px;
    min-block-size: 2.4rem;
    padding: 0.2rem 0.6rem;
  }
  input {
    inline-size: 9em;
    max-inline-size: 60vw;
  }
  .ok input,
  .ok select {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .ko input,
  .ko select {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .expected {
    font-weight: 600;
    color: var(--ok);
  }
</style>
