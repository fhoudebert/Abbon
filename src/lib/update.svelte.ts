/**
 * Mises à jour (Paramètres › Mises à jour, bandeau de l'accueil).
 * Les requêtes réseau sont faites côté Rust (src-tauri/src/update.rs).
 */
import { Channel, invoke, isTauri } from '@tauri-apps/api/core';
import { app } from '$lib/app.svelte';
import {
  downloadFor,
  downloadPage,
  isNewer,
  isValidServer,
  parseRelease,
  releaseUrl,
  type Release,
  type ReleaseFile,
} from '$lib/domain/release';

interface Support {
  platform: string;
  /** Processeur (x86_64, aarch64…) ; absent avant la version qui le fournit. */
  arch?: string;
  selfUpdate: boolean;
  defaultServer: string | null;
}

type DownloadEvent =
  | { event: 'started'; data: { total: number | null } }
  | { event: 'progress'; data: { chunk: number } }
  | { event: 'finished' };

const KEY_URL = 'update_url';
const KEY_AUTO = 'update_auto';
const KEY_LAST = 'update_last_check';
const DAY = 24 * 3600 * 1000;

export type UpdateStatus = 'idle' | 'checking' | 'uptodate' | 'available' | 'installing' | 'error' | 'installError';

class Updates {
  /** Faux dans un simple navigateur (aperçu) : pas de mise à jour. */
  readonly enabled = isTauri();
  support = $state<Support | null>(null);
  server = $state('');
  auto = $state(true);
  status = $state<UpdateStatus>('idle');
  error = $state<string | null>(null);
  release = $state<Release | null>(null);
  received = $state(0);
  total = $state<number | null>(null);
  lastCheck = $state<string | null>(null);

  readonly current = __APP_VERSION__;
  /** Fichier proposé pour cet appareil (APK sur Android). */
  file = $derived<ReleaseFile | undefined>(
    this.release && this.support ? downloadFor(this.release, this.support.platform, this.support.arch) : undefined,
  );

  async init() {
    if (!this.enabled || this.support) return;
    try {
      this.support = await invoke<Support>('update_support');
      const repo = await app.repo();
      this.server = (await repo.getSetting(KEY_URL)) ?? this.support.defaultServer ?? '';
      this.auto = (await repo.getSetting(KEY_AUTO)) !== 'false';
      this.lastCheck = await repo.getSetting(KEY_LAST);
      // Vérification automatique, au plus une fois par jour, sans message en cas d'échec.
      const due = !this.lastCheck || Date.now() - Date.parse(this.lastCheck) > DAY;
      if (this.auto && this.server && due) await this.check(true);
    } catch {
      /* hors ligne ou serveur indisponible : silencieux au démarrage */
    }
  }

  async setServer(url: string) {
    const v = url.trim().replace(/\/+$/, '');
    if (v && !isValidServer(v)) throw new Error('https');
    this.server = v;
    this.release = null;
    this.status = 'idle';
    const repo = await app.repo();
    if (v) await repo.setSetting(KEY_URL, v);
    else await repo.deleteSetting(KEY_URL);
  }

  async setAuto(on: boolean) {
    this.auto = on;
    await (await app.repo()).setSetting(KEY_AUTO, String(on));
  }

  /** Lit version.json (site ou dernière release GitHub) et compare avec la version installée. */
  async check(silent = false) {
    if (!this.enabled || !this.server) return;
    this.status = 'checking';
    this.error = null;
    try {
      const release = parseRelease(await invoke('fetch_release', { server: this.server }));
      if (!release) throw new Error('version.json');
      this.release = release;
      this.status = isNewer(release.version, this.current) ? 'available' : 'uptodate';
      this.lastCheck = new Date().toISOString();
      await (await app.repo()).setSetting(KEY_LAST, this.lastCheck);
    } catch (e) {
      this.status = silent ? 'idle' : 'error';
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  /**
   * Ordinateur : télécharge, vérifie la signature, installe et relance.
   * Android : ouvre l'APK dans le navigateur (installation par le système).
   */
  async install() {
    if (!this.release) return;
    if (this.support?.selfUpdate) {
      this.status = 'installing';
      this.received = 0;
      this.total = null;
      const channel = new Channel<DownloadEvent>();
      channel.onmessage = (m) => {
        if (m.event === 'started') this.total = m.data.total;
        else if (m.event === 'progress') this.received += m.data.chunk;
      };
      try {
        await invoke('install_update', { server: this.server, onEvent: channel });
      } catch (e) {
        this.status = 'installError';
        this.error = e instanceof Error ? e.message : String(e);
      }
    } else if (this.file) {
      await this.open(releaseUrl(this.server, this.file));
    }
  }

  async openDownloadPage() {
    if (this.server) await this.open(downloadPage(this.server));
  }

  private async open(url: string) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
  }
}

export const updates = new Updates();
