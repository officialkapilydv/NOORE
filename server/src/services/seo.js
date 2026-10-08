/**
 * Server-side SEO for the single-page storefront: link previews (WhatsApp, iMessage, social) and
 * crawlers that don't run JavaScript only ever see index.html, so the per-page title, description,
 * image and canonical URL are written into it here, plus Product structured data.
 */
import { catalog } from './catalog.js';
import { getSettings, pagesRepo } from './settings.js';

const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const BRAND = 'NOORÉ';

export const siteOrigin = (req) => `${req.protocol}://${req.get('host')}`;

// A malformed link (/products/%E0%A4) must still get the app shell, not a 500.
const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

async function metaFor(pathname) {
  const product = pathname.match(/^\/products\/([^/]+)\/?$/);
  if (product) {
    const p = catalog.product(decode(product[1]));
    if (!p) return null;
    return { title: `${p.name} · ${BRAND}`, description: p.tagline || p.description, image: p.image, product: p, type: 'product' };
  }
  const collection = pathname.match(/^\/collections\/([^/]+)\/?$/);
  if (collection) {
    const c = catalog.collection(decode(collection[1]));
    if (!c) return null;
    return { title: `${c.name} collection · ${BRAND}`, description: c.description || c.title, image: c.image };
  }
  const page = pathname.match(/^\/pages\/([^/]+)\/?$/);
  if (page) {
    const doc = await pagesRepo.get(decode(page[1]));
    if (!doc || doc.published === false) return null;
    return { title: `${doc.title} · ${BRAND}`, description: doc.summary || doc.description };
  }
  const fixed = {
    '/shop': ['Shop all candles', 'Twenty-one hand-poured fragrance candles across Essentials, Premium and Luxury.'],
    '/collections': ['Collections', 'Essentials, Premium and Luxury — three expressions of hand-poured fragrance candles.'],
    '/gifting': ['Gifting', 'Curated gift sets, build-your-own boxes and corporate gifting from NOORÉ.'],
    '/story': ['Our story', 'How NOORÉ hand-pours its fragrance candles, in small batches in India.'],
    '/contact': ['Contact', 'Questions about an order, a fragrance or corporate gifting? Write to the NOORÉ studio.'],
  }[pathname.replace(/\/$/, '') || '/'];
  if (fixed) return { title: `${fixed[0]} · ${BRAND}`, description: fixed[1] };
  return null;
}

function productJsonLd(p, origin) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || p.tagline,
    image: p.image ? new URL(p.image, origin).href : undefined,
    sku: p.id || p.slug,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      url: `${origin}/products/${p.slug}`,
      priceCurrency: 'INR',
      price: p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(p.reviewCount ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviewCount } } : {}),
  };
  // "<" escaped so product text can never close the script tag.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

/** index.html with this path's meta tags filled in. */
export async function renderIndex(html, { origin, pathname }) {
  const meta = (await metaFor(pathname)) || {};
  const seo = getSettings()?.seo || {};
  const title = meta.title || seo.title;
  const description = meta.description || seo.description;
  // Function replacers throughout: in a replacement *string*, "$'" or "$&" from a URL or product
  // text would be read as a pattern and paste chunks of the document into the tag.
  const setAttr = (out, selector, value) => (value ? out.replace(new RegExp(`(<meta ${selector} content=")[^"]*`), (_, open) => open + escapeHtml(value)) : out);

  let out = html;
  if (title) {
    out = out.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(title)}</title>`);
    out = setAttr(out, 'property="og:title"', title);
  }
  out = setAttr(out, 'name="description"', description);
  out = setAttr(out, 'property="og:description"', description);
  // Preview scrapers need an absolute image URL.
  const image = meta.image || (out.match(/<meta property="og:image" content="([^"]*)"/) || [])[1];
  if (image) out = setAttr(out, 'property="og:image"', new URL(image, origin).href);

  const url = `${origin}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
  const extra = [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="${meta.type === 'product' ? 'product' : 'website'}" />`,
    meta.product ? productJsonLd(meta.product, origin) : '',
  ].join('\n    ');
  return out.replace('</head>', () => `    ${extra}\n  </head>`);
}

export function robotsTxt(origin) {
  return ['User-agent: *', 'Disallow: /admin', 'Disallow: /checkout', 'Disallow: /account', 'Disallow: /order/', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}

export async function sitemapXml(origin) {
  const paths = ['/', '/shop', '/collections', '/gifting', '/story', '/contact'];
  for (const c of catalog.collections()) if (c.slug !== 'gifting') paths.push(`/collections/${c.slug}`);
  for (const p of catalog.products()) paths.push(`/products/${p.slug}`);
  for (const page of await pagesRepo.published()) paths.push(`/pages/${page.slug}`);
  const urls = paths.map((p) => `  <url><loc>${escapeHtml(origin + p)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
