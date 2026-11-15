/**
 * Fichiers : enregistrer un export, écrire les sauvegardes automatiques.
 * - Application (Tauri) : fenêtre « Enregistrer sous » (plugin dialog) puis écriture (plugin fs).
 * - Navigateur (aperçu) : téléchargement classique.
 * La lecture d'un fichier choisi par l'utilisateur passe par <input type="file">, qui fonctionne
 * partout (bureau et Android) sans permission particulière.
 */
import { isTauri } from '@tauri-apps/api/core';

export interface FileFilter {
  name: string;
  extensions: string[];
}

/** Propose d'enregistrer ; renvoie le chemin choisi, ou null si l'utilisateur annule. */
export async function saveFile(defaultName: string, bytes: Uint8Array, filters: FileFilter[]): Promise<string | null> {
  if (!isTauri()) {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart]));
    const a = Object.assign(document.createElement('a'), { href: url, download: defaultName });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return defaultName;
  }
  const { save } = await import('@tauri-apps/plugin-dialog');
  const { writeFile } = await import('@tauri-apps/plugin-fs');
  const path = await save({ defaultPath: defaultName, filters });
  if (!path) return null;
  await writeFile(path, bytes);
  return path;
}

/** Lit un fichier choisi dans un <input type="file">. */
export async function readPicked(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

const BACKUP_DIR = 'backups';
const KEEP = 5;

/**
 * Sauvegarde automatique (avant import ou restauration) dans le dossier de données de
 * l'application ; les 5 plus récentes sont conservées. Renvoie le nom du fichier, ou null
 * hors application.
 */
export async function writeAutoBackup(bytes: Uint8Array, now = new Date()): Promise<string | null> {
  if (!isTauri()) return null;
  const fs = await import('@tauri-apps/plugin-fs');
  const base = fs.BaseDirectory.AppLocalData;
  if (!(await fs.exists(BACKUP_DIR, { baseDir: base }))) await fs.mkdir(BACKUP_DIR, { baseDir: base, recursive: true });
  const name = `abbon-auto-${now.toISOString().replace(/[:.]/g, '-')}.qcm`;
  await fs.writeFile(`${BACKUP_DIR}/${name}`, bytes, { baseDir: base });
  const old = (await fs.readDir(BACKUP_DIR, { baseDir: base }))
    .map((e) => e.name)
    .filter((n) => /^abbon-auto-.*\.qcm$/.test(n))
    .sort()
    .reverse()
    .slice(KEEP);
  for (const n of old) await fs.remove(`${BACKUP_DIR}/${n}`, { baseDir: base });
  return name;
}

/** Nom de fichier sûr à partir d'un titre. */
export function fileSafe(title: string, fallback = 'qcm'): string {
  const s = title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return s || fallback;
}
