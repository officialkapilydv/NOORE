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

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

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
  app.use('/images/uploads', express.static(path.join(config.paths.publicDir, 'images', 'uploads'), { maxAge: '7d' }));
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
  if (fs.existsSync(path.join(config.paths.clientDist, 'index.html'))) {
    app.use(express.static(config.paths.clientDist, { maxAge: '1h' }));
    app.get(/^\/(?!api\/|images\/|assets\/).*/, (req, res) => res.sendFile(path.join(config.paths.clientDist, 'index.html')));
  }

  app.use('/api', notFound);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
