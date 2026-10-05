/**
 * Catalog service — products & collections.
 * Seeded from shared/catalog on first boot, then owned by the JSON store so the
 * admin panel can edit everything. Kept in memory for synchronous pricing.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { collection } from '../db/store.js';

const productsRepo = collection('products');
const collectionsRepo = collection('collections');

let products = [];
let collections = [];
const bySlug = new Map();

function reindex() {
  bySlug.clear();
  for (const p of products) bySlug.set(p.slug, p);
}

export async function loadCatalog() {
  products = await productsRepo.all();
  collections = await collectionsRepo.all();
  if (products.length === 0) {
    const seed = JSON.parse(await fs.readFile(path.join(config.paths.catalog, 'products.json'), 'utf8'));
    products = await productsRepo.replaceAll(seed.map((p, i) => ({ published: true, order: i, ...p })));
  }
  if (collections.length === 0) {
    const seed = JSON.parse(await fs.readFile(path.join(config.paths.catalog, 'collections.json'), 'utf8'));
    collections = await collectionsRepo.replaceAll(seed);
  }
  reindex();
  return { products, collections };
}

export const catalog = {
  products: ({ includeUnpublished = false } = {}) => (includeUnpublished ? products : products.filter((p) => p.published !== false)),
  collections: () => collections,
  product: (slug, { includeUnpublished = false } = {}) => {
    const p = bySlug.get(slug) || null;
    if (!p) return null;
    return includeUnpublished || p.published !== false ? p : null;
  },
  collection: (slug) => collections.find((c) => c.slug === slug) || null,
  families: () => [...new Set(products.map((p) => p.family))].filter((f) => f !== 'set'),
};

/* ─── Mutations (admin) ─── */
export async function saveProducts() {
  products = await productsRepo.replaceAll(products);
  reindex();
}

export async function upsertProduct(doc) {
  const idx = products.findIndex((p) => p.slug === doc.slug);
  const now = new Date().toISOString();
  if (idx === -1) {
    products.push({ published: true, order: products.length, createdAt: now, ...doc, updatedAt: now });
  } else {
    products[idx] = { ...products[idx], ...doc, updatedAt: now };
  }
  await saveProducts();
  return bySlug.get(doc.slug);
}

export async function deleteProduct(slug) {
  const before = products.length;
  products = products.filter((p) => p.slug !== slug);
  if (products.length === before) return false;
  await saveProducts();
  return true;
}

export async function reorderProducts(slugs) {
  const rank = new Map(slugs.map((s, i) => [s, i]));
  products = [...products].sort((a, b) => (rank.get(a.slug) ?? 1e9) - (rank.get(b.slug) ?? 1e9)).map((p, i) => ({ ...p, order: i }));
  await saveProducts();
}

export async function upsertCollection(doc) {
  const idx = collections.findIndex((c) => c.slug === doc.slug);
  if (idx === -1) collections.push(doc);
  else collections[idx] = { ...collections[idx], ...doc };
  collections = await collectionsRepo.replaceAll(collections);
  return collections.find((c) => c.slug === doc.slug);
}

/* ─── Queries ─── */
const SORTERS = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  newest: (a, b) => Number((b.badges || []).includes('New')) - Number((a.badges || []).includes('New')),
  'name-asc': (a, b) => a.name.localeCompare(b.name),
  order: (a, b) => (a.order ?? 0) - (b.order ?? 0),
};

export function queryProducts({ collection: col, family, q, minPrice, maxPrice, sort = 'featured', featured, limit, exclude, includeUnpublished = false } = {}) {
  let list = catalog.products({ includeUnpublished });
  if (col) {
    const wanted = String(col).split(',').map((s) => s.trim());
    list = list.filter((p) => wanted.includes(p.collection));
  }
  if (family) {
    const wanted = String(family).split(',').map((s) => s.trim());
    list = list.filter((p) => wanted.includes(p.family));
  }
  if (featured === 'true' || featured === true) list = list.filter((p) => p.featured);
  if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
  if (exclude) list = list.filter((p) => p.slug !== exclude);
  if (q) {
    const needle = String(q).toLowerCase().trim();
    const score = (p) => {
      const hay = [p.name, p.tagline, p.description, p.family, p.collection, ...(p.moods || []), ...(p.rooms || []), ...Object.values(p.notes || {}).flat()].join(' ').toLowerCase();
      let s = 0;
      if (p.name.toLowerCase().includes(needle)) s += 10;
      if (hay.includes(needle)) s += 3;
      for (const word of needle.split(/\s+/)) if (word && hay.includes(word)) s += 1;
      return s;
    };
    list = list.map((p) => [score(p), p]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).map(([, p]) => p);
  } else {
    list = [...list].sort(SORTERS[sort] || SORTERS.featured);
  }
  if (limit) list = list.slice(0, Number(limit));
  return list;
}

export function relatedProducts(slug, limit = 4) {
  const base = bySlug.get(slug);
  if (!base) return [];
  const score = (p) => {
    let s = 0;
    if (p.collection === base.collection) s += 2;
    if (p.family === base.family) s += 3;
    if ((p.rooms || []).some((r) => (base.rooms || []).includes(r))) s += 1;
    if ((p.moods || []).some((m) => (base.moods || []).includes(m))) s += 1;
    return s;
  };
  return catalog.products()
    .filter((p) => p.slug !== slug && p.kind !== 'set')
    .map((p) => [score(p), p])
    .sort((a, b) => b[0] - a[0])
    .slice(0, limit)
    .map(([, p]) => p);
}
