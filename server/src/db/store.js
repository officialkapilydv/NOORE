/**
 * Tiny JSON document store.
 * Each collection lives in server/data/<name>.json. Writes are serialised and atomic
 * (write to a temp file, then rename) so a crash never leaves a half-written file.
 * Swap this module for a Mongo/Postgres repository later — the route layer only
 * talks to `collection(name)` / `singleton(name)`.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

const cache = new Map();
let writeChain = Promise.resolve();

async function ensureDir() {
  await fs.mkdir(config.paths.data, { recursive: true });
}

function fileFor(name) {
  return path.join(config.paths.data, `${name}.json`);
}

async function load(name) {
  if (cache.has(name)) return cache.get(name);
  await ensureDir();
  try {
    const raw = await fs.readFile(fileFor(name), 'utf8');
    const docs = JSON.parse(raw);
    cache.set(name, Array.isArray(docs) ? docs : []);
    return cache.get(name);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    cache.set(name, []);
    return cache.get(name);
  }
}

function persist(name) {
  const docs = cache.get(name) || [];
  const snapshot = JSON.stringify(docs, null, 2);
  writeChain = writeChain
    .then(async () => {
      await ensureDir();
      const target = fileFor(name);
      const tmp = `${target}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot, 'utf8');
      await fs.rename(tmp, target);
    })
    .catch((err) => console.error(`[store] failed to persist ${name}:`, err));
  return writeChain;
}

export function collection(name) {
  return {
    async all() {
      return [...(await load(name))];
    },
    async find(predicate) {
      return (await load(name)).find(predicate) || null;
    },
    async filter(predicate) {
      return (await load(name)).filter(predicate);
    },
    async insert(doc) {
      const docs = await load(name);
      const record = { ...doc, createdAt: doc.createdAt || new Date().toISOString() };
      docs.push(record);
      await persist(name);
      return record;
    },
    async update(predicate, patch) {
      const docs = await load(name);
      const idx = docs.findIndex(predicate);
      if (idx === -1) return null;
      docs[idx] = { ...docs[idx], ...patch, updatedAt: new Date().toISOString() };
      await persist(name);
      return docs[idx];
    },
    async remove(predicate) {
      const docs = await load(name);
      const kept = docs.filter((d) => !predicate(d));
      const removed = docs.length - kept.length;
      if (removed) {
        cache.set(name, kept);
        await persist(name);
      }
      return removed;
    },
    async replaceAll(next) {
      cache.set(name, [...next]);
      await persist(name);
      return cache.get(name);
    },
    async count(predicate = () => true) {
      return (await load(name)).filter(predicate).length;
    },
  };
}

export function deepMerge(base, patch) {
  if (Array.isArray(patch) || typeof patch !== 'object' || patch === null) return patch === undefined ? base : patch;
  const out = { ...(base || {}) };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(base?.[k], v) : v;
  }
  return out;
}

/** A single JSON document (settings-style), merged over defaults. */
export function singleton(name, defaults = {}) {
  const col = collection(name);
  return {
    async get() {
      const doc = await col.find((d) => d.id === name);
      return deepMerge(defaults, doc || {});
    },
    async set(patch) {
      const existing = await col.find((d) => d.id === name);
      if (!existing) return col.insert({ id: name, ...deepMerge(defaults, patch) });
      return col.update((d) => d.id === name, deepMerge(existing, patch));
    },
  };
}
