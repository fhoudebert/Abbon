<script lang="ts">
  import type { Snippet } from 'svelte';
  import { t } from '$lib/i18n/index.svelte';

  /** Fenêtre de confirmation (élément <dialog> natif, pas de window.confirm). */
  let {
    title,
    body,
    confirmLabel,
    danger = false,
    onconfirm,
    extra,
    children,
  }: {
    title: string;
    body?: string;
    confirmLabel: string;
    danger?: boolean;
    onconfirm: () => void | Promise<void>;
    extra?: Snippet<[() => void]>;
    /** Contenu entre le texte et les boutons (cases à cocher…). */
    children?: Snippet;
  } = $props();

  let dialog: HTMLDialogElement;

  export function open() {
    dialog.showModal();
  }
  const close = () => dialog.close();
</script>

<dialog bind:this={dialog} aria-labelledby="cd-title">
  <h2 id="cd-title">{title}</h2>
  {#if body}<p>{body}</p>{/if}
  {@render children?.()}
  <div class="actions">
    <button class="secondary" onclick={close}>{t('common.cancel')}</button>
    {@render extra?.(close)}
    <button
      class:danger
      onclick={async () => {
        close();
        await onconfirm();
      }}>{confirmLabel}</button
    >
  </div>
</dialog>

<style>
  dialog {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    max-inline-size: min(30rem, 92vw);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.4);
  }
  h2 {
    font-size: 1.15rem;
  }
  .actions {
    justify-content: flex-end;
  }
  .danger {
    background: var(--bad);
    border-color: var(--bad);
  }
  p {
    white-space: pre-line;
  }
</style>
