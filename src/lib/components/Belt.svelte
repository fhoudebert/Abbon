<script lang="ts">
  import type { BeltId } from '$lib/domain/rewards';

  /** Dessin d'une ceinture nouée. Décoratif : le nom du rang est toujours écrit à côté. */
  let { belt, size = 48 }: { belt: BeltId; size?: number } = $props();

  const COLORS: Record<BeltId, string> = {
    white: '#f4f4f0',
    yellow: '#f2c200',
    orange: '#ee7d12',
    green: '#2f9a45',
    blue: '#2563c4',
    brown: '#7b4a22',
    black: '#161616',
  };
</script>

<svg class="belt {belt}" width={size} height={size * 0.75} viewBox="0 0 64 48" aria-hidden="true" focusable="false">
  <g fill={COLORS[belt]} stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <path d="M3 14 h58 v10 h-58 z" />
    <path d="M27 22 l-10 22 l7 1 l8 -19 z" />
    <path d="M37 22 l10 22 l-7 1 l-8 -19 z" />
    <rect x="25" y="10" width="14" height="18" rx="3" />
  </g>
</svg>

<style>
  svg {
    flex: none;
    color: var(--text);
  }
  /* Contour discret pour les couleurs franches ; marqué pour les ceintures blanche et noire. */
  svg:not(.white, .black) {
    color: color-mix(in srgb, var(--text) 45%, transparent);
  }
</style>
