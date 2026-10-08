import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { catalog } from './services/catalog.js';
import { getSettings } from './services/settings.js';
import { notFound, errorHandler } from './middleware/errors.js';
import productsRouter from './routes/products.js';
import collectionsRouter from './routes/collections.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';
import engagementRouter from './routes/engagement.js';
import contentRouter from './routes/content.js';
import adminRouter from './routes/admin/index.js';
import { renderIndex, robotsTxt, siteOrigin, sitemapXml } from './services/seo.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Only trust X-Forwarded-For when a proxy we control sits in front (set TRUST_PROXY=1 behind
  // nginx/Caddy/a load balancer). Otherwise any client could fake its IP and dodge rate limits.
  const trustProxy = process.env.TRUST_PROXY || 'false';
  if (trustProxy === 'true') app.set('trust proxy', true);
  else if (/^\d+$/.test(trustProxy)) app.set('trust proxy', Number(trustProxy));
  else if (trustProxy !== 'false') app.set('trust proxy', trustProxy); // e.g. "loopback" or an IP list
  else app.set('trust proxy', false);

  // CORS: same-origin requests (the built storefront served by this server, module scripts, fetch)
  // and the configured dev origins get headers; anything else simply gets no CORS headers.
  app.use(cors((req, cb) => {
    const origin = req.headers.origin;
    const host = req.headers.host;
    const sameOrigin = !origin || (host && (origin === `http://${host}` || origin === `https://${host}`));
    const allowed = sameOrigin || config.env !== 'production' || config.corsOrigins.includes(origin);
    cb(null, { origin: allowed, credentials: true });
  }));
  app.use(express.json({ limit: '1mb' }));
  if (config.env !== 'test') app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

  // Static imagery (product shots, banners, admin uploads)
  // Uploads are admin-supplied files on our own origin: never sniff them into HTML, never run scripts in them (SVG).
  app.use('/images/uploads', express.static(path.join(config.paths.publicDir, 'images', 'uploads'), {
    maxAge: '7d',
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
    },
  }));
  app.use('/images', express.static(path.join(config.paths.publicDir, 'images'), { maxAge: '30d', immutable: true }));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, name: 'NOORÉ API', env: config.env, products: catalog.products().length, time: new Date().toISOString() });
  });
  app.get('/api/meta', (req, res) => {
    const s = getSettings();
    res.json({
      brand: { ...s.brand, currency: config.currency },
      shipping: s.shipping,
      families: catalog.families(),
    });
  });

  app.use('/api/products', productsRouter);
  app.use('/api/collections', collectionsRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/auth', authRouter);
  app.use('/api', contentRouter);
  app.use('/api', engagementRouter);
  app.use('/api/admin', adminRouter);

  // Production: serve the built storefront + admin from the same origin (SPA fallback)
  // index.html is never cached (a stale copy points at chunks a rebuild has deleted, and the page
  // hangs); the content-hashed files in /assets can be cached forever.
  if (fs.existsSync(path.join(config.paths.clientDist, 'index.html'))) {
    app.use(express.static(config.paths.clientDist, {
      index: false, // "/" goes through renderIndex below like every other page
      maxAge: '1h',
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
        else if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }));
    app.get('/robots.txt', (req, res) => res.type('text/plain').send(robotsTxt(siteOrigin(req))));
    app.get('/sitemap.xml', async (req, res) => res.type('application/xml').send(await sitemapXml(siteOrigin(req))));
    // Paths that look like files (/favicon.ico, /missing.js) get a real 404 instead of the app shell.
    const indexHtml = fs.readFileSync(path.join(config.paths.clientDist, 'index.html'), 'utf8');
    app.get(/^\/(?!api\/|images\/|assets\/)(?!.*\.[a-z0-9]+$).*/i, async (req, res) => {
      let html = indexHtml;
      try {
        html = await renderIndex(indexHtml, { origin: siteOrigin(req), pathname: req.path });
      } catch (err) {
        console.error('[seo] could not render meta tags; serving the plain shell:', err); // the page itself must still load
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(html);
    });
  }

  app.use('/api', notFound);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
