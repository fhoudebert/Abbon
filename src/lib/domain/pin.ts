/**
 * Code PIN facultatif du mode administration.
 * Stocké sous forme d'empreinte PBKDF2-SHA-256 salée (jamais en clair).
 * Rappel : l'application est locale ; le PIN évite une modification par mégarde
 * (enfant, appareil partagé), il ne protège pas contre un accès direct à la base.
 */
export interface PinRecord {
  salt: string; // base64
  hash: string; // base64
  iterations: number;
}

const ITERATIONS = 150_000;
const enc = new TextEncoder();

const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pin: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return toB64(bits);
}

/** 4 à 12 chiffres. */
export const isValidPin = (pin: string) => /^\d{4,12}$/.test(pin);

export async function createPin(pin: string, iterations = ITERATIONS): Promise<PinRecord> {
  if (!isValidPin(pin)) throw new Error('invalid pin');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toB64(salt), hash: await derive(pin, salt, iterations), iterations };
}

export async function verifyPin(pin: string, record: PinRecord): Promise<boolean> {
  const hash = await derive(pin, fromB64(record.salt), record.iterations);
  // Comparaison à temps constant.
  if (hash.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return diff === 0;
}
