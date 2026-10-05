/**
 * Site settings (brand, contact, address, social, shipping, announcement, home copy,
 * SEO, FAQ, legal) and editable content pages (terms, privacy, …).
 * Defaults ship in shared/content so the storefront can render them offline too.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { collection, deepMerge, singleton } from '../db/store.js';

const CONTENT_DIR = path.resolve(config.paths.catalog, '../content');

let defaults = {};
let settings = {};
const store = { current: null };
const pages = collection('pages');

export async function loadSettings() {
  defaults = JSON.parse(await fs.readFile(path.join(CONTENT_DIR, 'settings.json'), 'utf8'));
  store.current = singleton('settings', defaults);
  settings = await store.current.get();

  // Seed pages on first boot
  if ((await pages.count()) === 0) {
    const seed = JSON.parse(await fs.readFile(path.join(CONTENT_DIR, 'pages.json'), 'utf8'));
    for (const p of seed) await pages.insert({ ...p, updatedAt: new Date().toISOString() });
  }
  return settings;
}

export const getSettings = () => settings;

/** Public subset — everything the storefront needs, nothing private. */
export function publicSettings() {
  const { brand, contact, address, social, shipping, announcement, home, seo, faq, legal } = settings;
  return { brand, contact, address, social, shipping, announcement, home, seo, faq, legal };
}

export async function updateSettings(patch) {
  await store.current.set(patch);
  settings = deepMerge(settings, patch);
  return settings;
}

export async function resetSettings() {
  await collection('settings').replaceAll([]);
  settings = deepMerge({}, defaults);
  return settings;
}

export const pagesRepo = {
  all: () => pages.all(),
  published: async () => (await pages.all()).filter((p) => p.published !== false),
  get: (slug) => pages.find((p) => p.slug === slug),
  upsert: async (doc) => {
    const existing = await pages.find((p) => p.slug === doc.slug);
    if (existing) return pages.update((p) => p.slug === doc.slug, doc);
    return pages.insert({ showInFooter: false, published: true, ...doc });
  },
  remove: (slug) => pages.remove((p) => p.slug === slug),
};
