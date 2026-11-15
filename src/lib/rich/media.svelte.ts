import { app } from '$lib/app.svelte';

/** Adresses `blob:` des images déjà chargées, par empreinte (réactif). */
const urls = $state<Record<string, string>>({});
const loading = new Map<string, Promise<void>>();

function b64ToBlob(data: string, mime: string): Blob {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function load(hash: string): Promise<void> {
  let p = loading.get(hash);
  if (!p) {
    p = (async () => {
      const m = await (await app.repo()).getMedia(hash);
      if (m) urls[hash] = URL.createObjectURL(b64ToBlob(m.data, m.mime));
    })();
    loading.set(hash, p);
  }
  return p;
}

/** Adresse d'une image ; lance son chargement si besoin (undefined en attendant). */
export function mediaUrl(hash: string | null | undefined): string | undefined {
  if (!hash) return undefined;
  if (!(hash in urls)) void load(hash);
  return urls[hash];
}

/** Charge des images avant d'ouvrir l'éditeur (qui a besoin des adresses tout de suite). */
export async function preloadMedia(hashes: readonly string[]) {
  await Promise.all(hashes.map(load));
}

/** Adresse déjà connue, sans chargement (rendu synchrone de l'éditeur). */
export const mediaUrlSync = (hash: string | null | undefined) => (hash ? urls[hash] : undefined);

// ---- Ajout d'une image ------------------------------------------------------

const MAX_SIDE = 1600;
export const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp,image/gif';

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) s += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(s);
}

/** Réduit l'image (1600 px au plus) ; JPEG reste JPEG, les autres formats deviennent PNG. */
async function compress(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  // Petit GIF (éventuellement animé) : gardé tel quel.
  if (file.type === 'image/gif' && scale === 1 && file.size < 1_000_000) {
    bitmap.close();
    return { blob: file, width, height };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('image encoding failed'))), type, 0.85),
  );
  return { blob, width, height };
}

/** Compresse, enregistre et renvoie l'empreinte de l'image. */
export async function addImage(file: File): Promise<string> {
  const { blob, width, height } = await compress(file);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const hash = await sha256Hex(bytes);
  await (await app.repo()).saveMedia({
    hash,
    mime: blob.type || file.type,
    width,
    height,
    sizeBytes: bytes.length,
    data: bytesToB64(bytes),
  });
  urls[hash] ??= URL.createObjectURL(blob);
  loading.set(hash, Promise.resolve());
  return hash;
}
