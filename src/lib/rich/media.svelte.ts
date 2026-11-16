import { app } from '$lib/app.svelte';
import { b64ToBytes, bytesToB64 } from '$lib/data/bytes';
import { looksLikeSvg, sanitizeSvg } from '$lib/domain/svg';

/** Adresses `blob:` des images déjà chargées, par empreinte (réactif). */
const urls = $state<Record<string, string>>({});
/** Figures SVG nettoyées, prêtes à être incrustées, par empreinte (réactif). */
const svgs = $state<Record<string, string>>({});
const loading = new Map<string, Promise<void>>();

export const SVG_MIME = 'image/svg+xml';
/** Identifiants d'une figure : préfixés par son empreinte, pour ne pas se mêler à ceux d'une autre. */
const svgPrefix = (hash: string) => `s${hash.slice(0, 10)}-`;

function keepSvg(hash: string, bytes: Uint8Array) {
  const clean = sanitizeSvg(new TextDecoder().decode(bytes), svgPrefix(hash));
  if (clean) svgs[hash] = clean;
}

const b64ToBlob = (data: string, mime: string) => new Blob([b64ToBytes(data) as BlobPart], { type: mime });

function load(hash: string): Promise<void> {
  let p = loading.get(hash);
  if (!p) {
    p = (async () => {
      const m = await (await app.repo()).getMedia(hash);
      if (!m) return;
      if (m.mime === SVG_MIME) keepSvg(hash, b64ToBytes(m.data));
      urls[hash] = URL.createObjectURL(b64ToBlob(m.data, m.mime));
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

/** Figure SVG nettoyée à incruster, si l'image en est une (undefined sinon, ou en attendant). */
export function mediaSvg(hash: string | null | undefined): string | undefined {
  if (!hash) return undefined;
  if (!(hash in urls)) void load(hash);
  return svgs[hash];
}

/** Charge des images avant d'ouvrir l'éditeur (qui a besoin des adresses tout de suite). */
export async function preloadMedia(hashes: readonly string[]) {
  await Promise.all(hashes.map(load));
}

/** Adresse déjà connue, sans chargement (rendu synchrone de l'éditeur). */
export const mediaUrlSync = (hash: string | null | undefined) => (hash ? urls[hash] : undefined);

// ---- Ajout d'une image ------------------------------------------------------

const MAX_SIDE = 1600;
export const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg';
const MAX_SVG_BYTES = 500_000;

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
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
  if (file.type === SVG_MIME || /\.svg$/i.test(file.name)) return addSvg(file);
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

/** Figure SVG : gardée telle quelle (elle est nettoyée à chaque affichage), refusée si elle est mal formée. */
async function addSvg(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = new TextDecoder().decode(bytes);
  if (bytes.length > MAX_SVG_BYTES || !looksLikeSvg(text) || !sanitizeSvg(text)) throw new Error('SVG invalide ou trop lourd');
  const hash = await sha256Hex(bytes);
  await (await app.repo()).saveMedia({ hash, mime: SVG_MIME, sizeBytes: bytes.length, data: bytesToB64(bytes) });
  keepSvg(hash, bytes);
  urls[hash] ??= URL.createObjectURL(new Blob([bytes as BlobPart], { type: SVG_MIME }));
  loading.set(hash, Promise.resolve());
  return hash;
}
